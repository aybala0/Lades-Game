// app/api/report/preview/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/tokens";

/**
 * POST /api/report/preview
 * Body: { token: string }
 *
 * Given a valid "report" token, returns the hunter's current target
 * so the UI can show “you’re about to eliminate <name>”.
 * This does NOT consume the token and does NOT change any state.
 */
export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "missing token" },
        { status: 400 }
      );
    }

    // 1) validate (do NOT consume)
    const t = await validateToken(token, "report");
    if (!t || !t.playerId) {
      return NextResponse.json(
        { ok: false, error: "invalid or expired token" },
        { status: 400 }
      );
    }
    const hunterId = t.playerId;

    // 2) hunter's active assignment (hunter -> target)
    const hunterEdge = await prisma.assignment.findFirst({
      where: { hunterId, active: true },
    });

    if (!hunterEdge) {
      return NextResponse.json(
        { ok: false, error: "no active assignment for hunter" },
        { status: 400 }
      );
    }

    // 3) fetch target for display
    const target = await prisma.player.findUnique({
      where: { id: hunterEdge.targetId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "target not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, target });
  } catch (e) {
    console.error("preview error:", e);
    return NextResponse.json(
      { ok: false, error: "preview failed" },
      { status: 500 }
    );
  }
}