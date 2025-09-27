// app/api/report/confirm/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken, createEmailToken } from "@/lib/tokens";
import type { Prisma } from "@prisma/client";
import { sendMail } from "@/lib/email";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
  }
  return handleConfirm(token);
}

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
  }
  return handleConfirm(token);
}

async function handleConfirm(token: string) {
  try {
    // 1) validate the confirm token
    const t = await validateToken(token, "confirm_elim");
    if (!t || !t.reportId || !t.playerId) {
      return NextResponse.json({ ok: false, error: "invalid or expired token" }, { status: 400 });
    }

    // 2) fetch the pending report + current edges we need to rewire
    const report = await prisma.report.findUnique({
      where: { id: t.reportId },
      select: {
        id: true,
        status: true,
        pendingUntil: true,
        hunterId: true,
        targetId: true,
        roundId: true,
      },
    });
    if (!report) return NextResponse.json({ ok: false, error: "report not found" }, { status: 400 });
    if (report.status !== "pending") {
      // idempotent: if already finalized, just return ok
      return NextResponse.json({ ok: true, alreadyFinalized: true });
    }
    if (t.playerId !== report.targetId) {
      return NextResponse.json({ ok: false, error: "token does not belong to the target" }, { status: 403 });
    }

    // find the target's edge (target -> targetTarget) in the same round
    const targetEdge = await prisma.assignment.findFirst({
      where: { roundId: report.roundId, hunterId: report.targetId, active: true },
      select: { id: true, targetId: true },
    });
    if (!targetEdge) {
      return NextResponse.json({ ok: false, error: "target edge not found" }, { status: 400 });
    }
    const hunterEdge = await prisma.assignment.findFirst({
      where: { roundId: report.roundId, hunterId: report.hunterId, active: true },
      select: { id: true },
    });
    if (!hunterEdge) {
      return NextResponse.json({ ok: false, error: "hunter edge not found" }, { status: 400 });
    }

    // also fetch hunter/player emails for notification later
    const [hunter, target] = await Promise.all([
      prisma.player.findUnique({ where: { id: report.hunterId }, select: { id: true, name: true, email: true } }),
      prisma.player.findUnique({ where: { id: report.targetId }, select: { id: true, name: true, email: true } }),
    ]);

    // 3) transaction: approve, eliminate, rewire, consume tokens
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a) mark report approved
      await tx.report.update({
        where: { id: report.id },
        data: { status: "approved", approvedAt: new Date() },
      });

      // b) eliminate target
      await tx.player.update({
        where: { id: report.targetId },
        data: { status: "eliminated" },
      });

      // c) remove the target's own active edge (delete to avoid unique conflicts on (roundId,targetId))
      await tx.assignment.delete({
        where: { id: targetEdge.id },
      });

      // d) update hunter's edge to point at target's target (rewire ring)
      const updatedHunterEdge = await tx.assignment.update({
        where: { id: hunterEdge.id },
        data: { targetId: targetEdge.targetId }, // stays active
        select: { id: true, targetId: true },
      });

      // e) count how many players remain (truly active)
      const remainingActivePlayers = await tx.player.count({
        where: { status: "active" },
      });

      // f) consume both confirm and dispute tokens for this report (belt & suspenders)
      await tx.emailToken.updateMany({
        where: {
          reportId: report.id,
          purpose: { in: ["confirm_elim", "dispute_elim"] },
          consumed: false,
        },
        data: { consumed: true },
      });

      // f2) rotate hunter's existing report tokens (consume any still-unconsumed)
      await tx.emailToken.updateMany({
        where: {
          playerId: report.hunterId,
          purpose: "report",
          consumed: false,
        },
        data: { consumed: true },
      });

      // g) optionally end the round if only one remains
      let roundEnded = false;
      if (remainingActivePlayers <= 1) {
        await tx.round.update({
          where: { id: report.roundId },
          data: { status: "ended" },
        });
        roundEnded = true;
      }

      return {
        roundEnded,
        nextTargetId: roundEnded ? null : updatedHunterEdge.targetId,
      };
    });

    // 4) If round continues, issue new tokens to the hunter and (optionally) email them
    let newReportToken: string | null = null;
    let newTargetToken: string | null = null;

    if (!result.roundEnded) {
      newReportToken = await createEmailToken({
        playerId: report.hunterId,
        purpose: "report",
        ttlMinutes: 60 * 24 * 7,
      });
      newTargetToken = await createEmailToken({
        playerId: report.hunterId,
        purpose: "target",
        ttlMinutes: 60 * 24 * 7,
      });

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      const targetUrl = `${baseUrl}/target?token=${newTargetToken}`;
      const reportUrl = `${baseUrl}/report?token=${newReportToken}`;

      // Best-effort email to hunter with their new links
      try {
        if (hunter?.email) {
          await sendMail({
            to: hunter.email,
            subject: "Next target assigned",
            html: `
              <p>Hi ${hunter.name},</p>
              <p>Your elimination of <strong>${target?.name}</strong> was confirmed.</p>
              <p><a href="${targetUrl}">View your new target</a></p>
              <p><a href="${reportUrl}">Report an elimination</a></p>
            `,
            text:
              `Hi ${hunter?.name}\n` +
              `Your elimination of ${target?.name} was confirmed.\n` +
              `View your new target: ${targetUrl}\n` +
              `Report an elimination: ${reportUrl}\n`,
          });
        }
      } catch (err) {
        console.error("sendMail failed (confirm notify hunter):", err);
      }
    } else {
      // Round ended here: notify all players with a final email
      try {
        type PlayerLite = { id: string; name: string; email: string | null; status: string };
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
        console.error("end-of-game email failed (confirm):", err);
      }
    }

    return NextResponse.json({
      ok: true,
      roundEnded: result.roundEnded,
      newReportToken,
      newTargetToken,
      nextTargetId: result.nextTargetId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}