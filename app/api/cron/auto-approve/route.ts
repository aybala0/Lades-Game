// app/api/cron/auto-approve/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createEmailToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

type PlayerLite = { id: string; name: string; email: string | null; status: string };

/**
 * Auto-approve any pending elimination reports whose pendingUntil has passed.
 * Safe to call repeatedly (idempotent).
 * For each report:
 *  - report -> approved (+ approvedAt)
 *  - target -> eliminated
 *  - rewire hunter to target's target
 *  - consume confirm/dispute tokens for that report
 *  - if game continues: issue hunter new report/target tokens and email them
 *  - if only 1 remains: end round
 */
export async function GET(req: Request) {
  return handleAutoApprove(req);
}

export async function POST(req: Request) {
  return handleAutoApprove(req);
}

async function handleAutoApprove(req?: Request) {
  // Optional auth guard for external cron pingers (query param or Bearer header)
  const expected = process.env.CRON_SECRET;
  if (expected && req) {
    const url = new URL(req.url);
    const qs = url.searchParams.get("secret");
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (qs !== expected && bearer !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  const now = new Date();

  // Find all still-pending reports whose pendingUntil has passed
  const dueReports = await prisma.report.findMany({
    where: {
      status: "pending",
      pendingUntil: { lt: now },
    },
    select: {
      id: true,
      roundId: true,
      hunterId: true,
      targetId: true,
    },
  });

  let processed = 0;
  const results: Array<{ reportId: string; ok: boolean; reason?: string }> = [];

  for (const r of dueReports) {
    try {
      // Fetch target's outgoing edge (target -> targetTarget) for rewiring
      const targetEdge = await prisma.assignment.findFirst({
        where: { roundId: r.roundId, hunterId: r.targetId, active: true },
        select: { id: true, targetId: true },
      });
      if (!targetEdge) {
        results.push({ reportId: r.id, ok: false, reason: "target edge not found" });
        continue;
      }

      const [hunter, target] = await Promise.all([
        prisma.player.findUnique({ where: { id: r.hunterId }, select: { id: true, name: true, email: true } }),
        prisma.player.findUnique({ where: { id: r.targetId }, select: { id: true, name: true, email: true } }),
      ]);

      // Transaction: approve, eliminate, rewire, consume tokens, maybe end round
      const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Re-check the report is still pending (idempotency)
        const current = await tx.report.findUnique({
          where: { id: r.id },
          select: { id: true, status: true, roundId: true, hunterId: true, targetId: true },
        });
        if (!current || current.status !== "pending") {
          return { alreadyFinalized: true, roundEnded: false, nextTargetId: null as string | null };
        }

        // a) approve
        await tx.report.update({
          where: { id: current.id },
          data: { status: "approved", approvedAt: new Date() },
        });

        // b) eliminate target
        await tx.player.update({
          where: { id: current.targetId },
          data: { status: "eliminated" },
        });

        // c) remove target's active edge to free (roundId,targetId) for rewiring
        await tx.assignment.delete({
          where: { id: targetEdge.id },
        });

        // d) update hunter's current active edge to targetTarget
        const hunterEdgeId = (await tx.assignment.findFirst({
          where: { roundId: current.roundId, hunterId: current.hunterId, active: true },
          select: { id: true },
        }))?.id;
        if (!hunterEdgeId) {
          // Ring inconsistent; bail gracefully
          return { alreadyFinalized: false, roundEnded: false, nextTargetId: null as string | null };
        }

        const updatedHunterEdge = await tx.assignment.update({
          where: { id: hunterEdgeId },
          data: { targetId: targetEdge.targetId },
          select: { targetId: true },
        });

        // e) consume confirm/dispute tokens associated to this report
        await tx.emailToken.updateMany({
          where: {
            reportId: current.id,
            purpose: { in: ["confirm_elim", "dispute_elim"] },
            consumed: false,
          },
          data: { consumed: true },
        });

        // f) count remaining players
        const remainingActivePlayers = await tx.player.count({
          where: { status: "active" },
        });

        let roundEnded = false;
        if (remainingActivePlayers <= 1) {
          await tx.round.update({
            where: { id: current.roundId },
            data: { status: "ended" },
          });
          roundEnded = true;
        }

        return {
          alreadyFinalized: false,
          roundEnded,
          nextTargetId: roundEnded ? null : updatedHunterEdge.targetId,
        };
      });

      // If we actually finalized and game continues, issue tokens + email hunter
      if (!txResult.alreadyFinalized && !txResult.roundEnded) {
        const [newReportToken, newTargetToken] = await Promise.all([
          createEmailToken({
            playerId: r.hunterId,
            purpose: "report",
            ttlMinutes: 60 * 24 * 7,
          }),
          createEmailToken({
            playerId: r.hunterId,
            purpose: "target",
            ttlMinutes: 60 * 24 * 7,
          }),
        ]);

        const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
        const targetUrl = `${baseUrl}/target?token=${newTargetToken}`;
        const reportUrl = `${baseUrl}/report?token=${newReportToken}`;

        try {
          if (hunter?.email) {
            await sendMail({
              to: hunter.email,
              subject: "Next target assigned (auto-approved)",
              html: `
                <p>Hi ${hunter.name},</p>
                <p>Your elimination of <strong>${target?.name}</strong> was auto-confirmed.</p>
                <p><a href="${targetUrl}">View your new target</a></p>
                <p><a href="${reportUrl}">Report an elimination</a></p>
              `,
              text:
                `Hi ${hunter?.name}\n` +
                `Your elimination of ${target?.name} was auto-confirmed.\n` +
                `View your new target: ${targetUrl}\n` +
                `Report an elimination: ${reportUrl}\n`,
            });
          }
        } catch (err) {
          console.error("sendMail failed (auto-approve notify hunter):", err);
        }
      }

      // If the round ended here, notify all players with a final email
      if (!txResult.alreadyFinalized && txResult.roundEnded) {
        try {
          const players: PlayerLite[] = await prisma.player.findMany({
            select: { id: true, name: true, email: true, status: true },
          });
          const winner = players.find((p) => p.status === "active");
          for (const p of players) {
            if (!p.email) continue;
            await sendMail({
              to: p.email,
              subject: "The game has ended",
              html: `
                <p>Hi ${p.name},</p>
                <p>The Assassin game is now over.</p>
                ${
                  winner && p.id === winner.id
                    ? `<p><strong>Congratulations, you are the last survivor!</strong></p>`
                    : `<p>Thanks for playing!</p>`
                }
              `,
              text:
                `Hi ${p.name}\n` +
                `The Assassin game is now over.\n` +
                (winner && p.id === winner.id
                  ? "Congratulations, you are the last survivor!"
                  : "Thanks for playing!"),
            });
          }
        } catch (err) {
          console.error("end-of-game email failed (auto-approve):", err);
        }
      }

      processed += 1;
      results.push({ reportId: r.id, ok: true });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      results.push({ reportId: r.id, ok: false, reason });
    }
  }

  return NextResponse.json({ ok: true, processed, results });
}