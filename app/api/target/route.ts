// app/api/target/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
    }

    // validate the token belongs to a player
    const t = await validateToken(token, "target");
    if (!t || !t.playerId) {
      return NextResponse.json({ ok: false, error: "invalid or expired token" }, { status: 400 });
    }

    // find their active assignment
    const assignment = await prisma.assignment.findFirst({
      where: { hunterId: t.playerId, active: true },
    });

    if (!assignment) {
      return NextResponse.json({ ok: false, error: "no active assignment" }, { status: 400 });
    }

    // get the target info
    const target = await prisma.player.findUnique({
      where: { id: assignment.targetId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!target) {
      return NextResponse.json({ ok: false, error: "target not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, target });
  } catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}
}