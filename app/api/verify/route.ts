export const runtime = "nodejs";

// app/api/verify/route.ts
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { validateToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

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
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
