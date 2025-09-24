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

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 🚨 Dev-only: always create a new player, ignore duplicates
    const player = await prisma.player.create({
      data: { name: trimmedName, email: normalizedEmail, status: "pending" },
      select: { id: true, name: true, email: true, status: true },
    });

    const token = await createEmailToken({
      playerId: player.id,
      purpose: "verify",
      ttlMinutes: 120,
    });

    const verifyUrl = `${APP_BASE_URL}/verify?token=${token}`;

    console.log("[verify link]", verifyUrl);

    try {
      await sendMail({
        to: player.email,
        subject: "Verify your signup",
        html: `
          <p>Hi ${player.name},</p>
          <p>Please click the link below to verify and join the game:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>If you didn’t request this, you can ignore this email.</p>
        `,
        text: `Hi ${player.name}\nVerify link: ${verifyUrl}\nIf you didn’t request this, you can ignore this email.`,
      });
    } catch (err) {
      console.error("sendMail failed:", err);
    }

    return NextResponse.json({ ok: true, verifyUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "signup failed" }, { status: 400 });
  }
}