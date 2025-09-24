// app/api/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
    }

    // Ensure the token exists, is for 'verify', unexpired, and unused
    const t = await validateToken(token, "verify");
    if (!t || !t.playerId) {
      return NextResponse.json({ ok: false, error: "invalid or expired link" }, { status: 400 });
    }

    // Activate the player and consume the token atomically
    await prisma.$transaction(async (tx) => {
      await tx.player.update({
        where: { id: t.playerId! },
        data: { status: "active" },
      });

      await tx.emailToken.update({
        where: { token },
        data: { consumed: true },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "verify failed" }, { status: 400 });
  }
}
