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

    // Fetch token + player so we can handle idempotency (double-clicks)
    const row = await prisma.emailToken.findUnique({
      where: { token },
      select: {
        id: true,
        purpose: true,
        consumed: true,
        expiresAt: true,
        playerId: true,
        player: { select: { id: true, status: true } },
      },
    });

    if (!row) {
      return NextResponse.json({ ok: false, error: "invalid link" }, { status: 400 });
    }
    if (row.purpose !== "verify") {
      return NextResponse.json({ ok: false, error: "wrong token purpose" }, { status: 400 });
    }
    if (row.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, error: "link expired" }, { status: 400 });
    }

    // If already consumed, consider success if player is active (idempotent verify)
    if (row.consumed) {
      if (row.player?.status === "active") {
        return NextResponse.json({ ok: true, alreadyVerified: true });
      }
      return NextResponse.json({ ok: false, error: "token already used" }, { status: 400 });
    }

    // Normal flow: activate + consume atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.player.update({
        where: { id: row.playerId! },
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
