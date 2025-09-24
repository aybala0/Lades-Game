// app/api/admin/clear-game/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/clear-game
 * Defaults (good for your flow):
 *  - keepPlayers = false  → delete all players
 *  - deleteVerifyTokens = true → remove any leftover verify tokens too
 *  - resetPlayerStatuses ignored when keepPlayers=false
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // ⬇️ NEW DEFAULTS: players are removed unless explicitly kept
    const keepPlayers = body?.keepPlayers === true ? true : false;
    const deleteVerifyTokens = body?.deleteVerifyTokens === false ? false : true;
    const resetPlayerStatuses = Boolean(body?.resetPlayerStatuses); // only matters if keepPlayers=true

    const result = await prisma.$transaction(async (tx) => {
      // delete gameplay tokens
      await tx.emailToken.deleteMany({ where: { purpose: { in: ["target", "report"] } } });
      if (deleteVerifyTokens) {
        await tx.emailToken.deleteMany({ where: { purpose: "verify" } });
      }

      const r1 = await tx.report.deleteMany({});
      const r2 = await tx.assignment.deleteMany({});
      const r3 = await tx.round.deleteMany({});

      if (!keepPlayers) {
        // nuke players and any leftover tokens (belt & suspenders)
        await tx.emailToken.deleteMany({});
        const rPlayers = await tx.player.deleteMany({});
        return {
          deletedReports: r1.count,
          deletedAssignments: r2.count,
          deletedRounds: r3.count,
          deletedPlayers: rPlayers.count,
          keptPlayers: false,
          resetPlayers: 0,
        };
      } else {
        let resetPlayers = 0;
        if (resetPlayerStatuses) {
          const res = await tx.player.updateMany({
            where: { status: "eliminated" },
            data: { status: "active" },
          });
          resetPlayers = res.count;
        }
        return {
          deletedReports: r1.count,
          deletedAssignments: r2.count,
          deletedRounds: r3.count,
          deletedPlayers: 0,
          keptPlayers: true,
          resetPlayers,
        };
      }
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}