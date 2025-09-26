// app/api/report/dispute/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";
import type { Prisma } from "@prisma/client";


export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
  }
  return handleDispute(token);
}

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
  }
  return handleDispute(token);
}

async function handleDispute(token: string) {
  try {
    const t = await validateToken(token, "dispute_elim");
    if (!t || !t.reportId || !t.playerId) {
      return NextResponse.json({ ok: false, error: "invalid or expired token" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: t.reportId },
      select: { id: true, status: true, hunterId: true, targetId: true },
    });
    if (!report) return NextResponse.json({ ok: false, error: "report not found" }, { status: 400 });
    if (report.status !== "pending") {
      return NextResponse.json({ ok: true, alreadyFinalized: true });
    }

    const [hunter, target] = await Promise.all([
      prisma.player.findUnique({ where: { id: report.hunterId }, select: { name: true, email: true } }),
      prisma.player.findUnique({ where: { id: report.targetId }, select: { name: true, email: true } }),
    ]);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.report.update({
        where: { id: report.id },
        data: { status: "disputed", disputedAt: new Date() },
      });
      await tx.player.update({
        where: { id: report.targetId },
        data: { status: "active" },
      });
      await tx.emailToken.update({
        where: { token },
        data: { consumed: true },
      });
    });

    const adminEmail = process.env.ADMIN_EMAIL || "";
    try {
      if (adminEmail) {
        await sendMail({
          to: adminEmail,
          subject: "Lades: Elimination Dispute",
          html: `<p>Dispute opened between <strong>${hunter?.name}</strong> and <strong>${target?.name}</strong>.</p>`,
          text: `Dispute opened between ${hunter?.name} and ${target?.name}.`,
        });
      }
      if (hunter?.email) {
        await sendMail({
          to: hunter.email,
          subject: "Your elimination report was disputed",
          html: `<p>Your target <strong>${target?.name}</strong> disputed the elimination. Please resolve it together. If they weren't actually eliminated, continue playing. If they were, submit the report again and ask ${target?.name} to accept.</p>`,
          text: `Your target ${target?.name} disputed the elimination. Please resolve it together.`,
        });
      }
    } catch (err) {
      console.error("sendMail failed (dispute notices):", err);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}