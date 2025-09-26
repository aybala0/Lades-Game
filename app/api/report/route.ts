// app/api/report/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { validateToken, createEmailToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
    }

    // 1) validate report token (belongs to hunter)
    const t = await validateToken(token, "report");
    if (!t || !t.playerId) {
      return NextResponse.json({ ok: false, error: "invalid or expired token" }, { status: 400 });
    }
    const hunterId = t.playerId;

    // 2) fetch hunter's active assignment (hunter -> target)
    const hunterEdge = await prisma.assignment.findFirst({
      where: { hunterId, active: true },
    });
    if (!hunterEdge) {
      return NextResponse.json({ ok: false, error: "no active assignment for hunter" }, { status: 400 });
    }
    const { roundId, targetId } = hunterEdge;

    // 2a) load current statuses of hunter and target, and block if already in review
    const [hunter, target] = await prisma.$transaction([
      prisma.player.findUnique({
        where: { id: hunterId },
        select: { status: true, name: true, email: true },
      }),
      prisma.player.findUnique({
        where: { id: targetId },
        select: { status: true, name: true, email: true },
      }),
    ]);
    if (!hunter || !target) {
      return NextResponse.json({ ok: false, error: "player(s) not found" }, { status: 400 });
    }
    if (hunter.status === "elimination_in_progress") {
      return NextResponse.json(
        { ok: false, error: "You can’t report while your own elimination is under review." },
        { status: 409 }
      );
    }
    if (target.status === "elimination_in_progress") {
      return NextResponse.json(
        { ok: false, error: "This target is already under elimination review." },
        { status: 409 }
      );
    }

    // 3) stage the elimination: create pending report + set target to elimination_in_progress + consume hunter token
    const pendingUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const { reportId } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const report = await tx.report.create({
        data: {
          roundId,
          hunterId,
          targetId,
          status: "pending",
          pendingUntil,
        },
        select: { id: true },
      });

      await tx.player.update({
        where: { id: targetId },
        data: { status: "elimination_in_progress" },
      });

      // consume the hunter's report token so it can't be reused
      await tx.emailToken.update({
        where: { token },
        data: { consumed: true },
      });

      return { reportId: report.id };
    });

    // 4) create 10‑minute tokens for the target (confirm / dispute), tied to this report
    const [confirmToken, disputeToken] = await Promise.all([
      createEmailToken({
        playerId: targetId,
        purpose: "confirm_elim",
        ttlMinutes: 10,
        reportId,
      }),
      createEmailToken({
        playerId: targetId,
        purpose: "dispute_elim",
        ttlMinutes: 10,
        reportId,
      }),
    ]);

    // 5) email the target with both links
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const confirmUrl = new URL("/api/report/confirm", baseUrl);
    confirmUrl.searchParams.set("token", confirmToken);

    const disputeUrl = new URL("/api/report/dispute", baseUrl);
    disputeUrl.searchParams.set("token", disputeToken);

    try {
      await sendMail({
        to: target.email || "",
        subject: "Elimination pending — respond within 10 minutes",
        html: `
          <p>Hi ${target.name},</p>
          <p>Your opponent <strong>${hunter.name}</strong> reported that you were eliminated.</p>
          <p>Please choose one within 10 minutes:</p>
          <p><a href="${confirmUrl.toString()}">Yes, I'm eliminated</a> &nbsp;|&nbsp; <a href="${disputeUrl.toString()}">This was a mistake</a></p>
          <p>If you do nothing, the system will auto-confirm after 10 minutes.</p>
        `,
        text:
          `Hi ${target.name}\n` +
          `Your opponent ${hunter.name} reported that you were eliminated.\n\n` +
          `Yes, I'm eliminated: ${confirmUrl.toString()}\n` +
          `This was a mistake: ${disputeUrl.toString()}\n\n` +
          `If you do nothing, the system will auto-confirm after 10 minutes.`,
      });
    } catch (err) {
      console.error("sendMail failed (pending notice):", err);
      // not fatal; the report is staged
    }

    return NextResponse.json({ ok: true, reportId, pendingUntil });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
