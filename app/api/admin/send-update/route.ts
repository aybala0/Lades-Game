// app/api/admin/send-update/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";

type PlayerLite = { name: string; email: string | null };

export async function POST() {
  // --- auth guard: admin only ---
  const session = await getServerSession(authOptions);
  const isAdmin =
    !!session?.user?.email &&
    session.user.email.toLowerCase().trim() === (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // --- compute counts ---
  const total = await prisma.player.count();
  const eliminated = await prisma.player.count({ where: { status: "eliminated" } });
  const remaining = total - eliminated;

  // --- get recipients ---
  const players: PlayerLite[] = await prisma.player.findMany({
    select: { name: true, email: true },
  });

  // --- SEND EMAILS (edit the message below to your liking) ---
  let sent = 0;
  for (const p of players) {
    if (!p.email) continue;

    const subject = "Lades — Game Update";
    const html = `
      <p>Hi ${p.name},</p>
      <p>An update from the Lades game:</p>
      <ul>
        <li>Players eliminated so far: <strong>${eliminated}</strong></li>
        <li>Players remaining: <strong>${remaining}</strong></li>
      </ul>
      <p>Good luck!</p>
    `;
    const text =
`
      <p>Hi ${p.name},</p>
      <p>An update from the Lades game:</p>
      <ul>
        <li>Players eliminated so far: <strong>${eliminated}</strong></li>
        <li>Players remaining: <strong>${remaining}</strong></li>
      </ul>
      <p>Good luck!</p>
    `;

    try {
      await sendMail({ to: p.email, subject, html, text });
      sent++;
    } catch (err) {
      console.error("update email failed for", p.email, err);
    }
  }

  return NextResponse.json({ ok: true, total, eliminated, remaining, sent });
}