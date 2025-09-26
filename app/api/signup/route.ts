import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEmailToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
    }
    if (typeof email !== "string" || !isEmail(email)) {
      return NextResponse.json({ ok: false, error: "valid email required" }, { status: 400 });
    }

    const activeRound = await prisma.round.findFirst({
      where: { status: "active" },
      select: { id: true },
    });
    if (activeRound) {
      return NextResponse.json(
        { ok: false, error: "Signups are closed: a game is currently in progress." },
        { status: 403 }
      );
    }
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const alreadysigned = await prisma.player.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (alreadysigned) {
      return NextResponse.json(
        { ok: false, error: "Daha önce bu emaille zaten kayıt oldunuz. Lütfen yalnızca bir kere kaydol." },
        { status: 403 }
      );
    }




    const player = await prisma.player.upsert({
      where: { email: normalizedEmail },
      update: {}, 
      create: { name: trimmedName, email: normalizedEmail, status: "pending" },
      select: { id: true, name: true, email: true, status: true },
    });

    const token = await createEmailToken({
      playerId: player.id,
      purpose: "verify",
      ttlMinutes: 120,
    });

    const verifyUrl = `${APP_BASE_URL}/verify?token=${token}`;

    try {
      await sendMail({
        to: player.email,
        subject: "Verify your signup",
        html: `
          <p>Merhaba ${player.name},</p>
          <p>Lades oyununa hoş geldin!</p>
          <p>Oyuna katılmak için lütfen aşağıdaki linke tıklayarak verificationunu tamamla:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        `,
        text: `Hi ${player.name}\nVerify link: ${verifyUrl}`,
      });
    } catch (err) {
      console.error("sendMail failed:", err);
      // still return the URL so you can test in dev
    }

// For now, return the link (and log it) so you can click it during dev.
console.log("[verify link]", verifyUrl);


    return NextResponse.json({ ok: true, verifyUrl });
  } catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}
}