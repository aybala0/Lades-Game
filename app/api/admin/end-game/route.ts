// app/api/admin/end-game/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/end-game
 * Body (optional): { winnerId?: string }
 * - Marks any active round as "ended" (if present).
 * - Deactivates all active assignments.
 * - Optionally records a winner id (if you later add Round.winnerId; safe to ignore otherwise).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const winnerId: string | undefined = body?.winnerId;

    // find any active round (ok if none)
    const activeRound = await prisma.round.findFirst({ where: { status: "active" } });

    await prisma.$transaction(async (tx) => {
      // deactivate all active assignments (global — single game model)
      await tx.assignment.updateMany({
        where: { active: true },
        data: { active: false },
      });

      // mark round ended if we have one
      if (activeRound) {
        await tx.round.update({
          where: { id: activeRound.id },
          data: { status: "ended" }, // add winnerId if you add that column in schema later
        });
      }
    });

    return NextResponse.json({
      ok: true,
      roundEnded: Boolean(activeRound),
      note: "Assignments deactivated; game ended.",
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}