// app/api/admin/start-round/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEmailToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

export async function POST() {
  try {
    // 1) pull all verified/active players
    const players = await prisma.player.findMany({ where: { status: "active" } });
    if (players.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Need at least 2 active players to start a round" },
        { status: 400 }
      );
    }

    // 2) create the round (endsAt optional; status drives lifecycle)
    const round = await prisma.round.create({
      data: { status: "active", startsAt: new Date(), endsAt: new Date() }, // you can ignore endsAt in your logic
    });

    // 3) shuffle players (Fisher–Yates)
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 4) create ring assignments
    const assignments = shuffled.map((hunter, i) => ({
      roundId: round.id,
      hunterId: hunter.id,
      targetId: shuffled[(i + 1) % shuffled.length].id,
      active: true,
    }));
    await prisma.assignment.createMany({ data: assignments });

    // 5) issue tokens for each hunter
    const targetTokens: Record<string, string> = {};
    const reportTokens: Record<string, string> = {};
    for (const a of assignments) {
      const tTok = await createEmailToken({
        playerId: a.hunterId,
        purpose: "target",
        ttlMinutes: 60 * 24 * 7, // 7 days
      });
      const rTok = await createEmailToken({
        playerId: a.hunterId,
        purpose: "report",
        ttlMinutes: 60 * 24 * 7, // 7 days
      });
      targetTokens[a.hunterId] = tTok;
      reportTokens[a.hunterId] = rTok;
    }

    const baseUrl = process.env.APP_BASE_URL!;

    for (const p of players) {
      const targetTok = targetTokens[p.id];
      const reportTok = reportTokens[p.id];
      if (!targetTok || !reportTok) continue;

      const targetUrl = `${baseUrl}/target?token=${targetTok}`;
      const reportUrl = `${baseUrl}/report?token=${reportTok}`;

      try {
        await sendMail({
          to: p.email,
          subject: "Your Assassin Game links",
          html: `
            <p>Hi ${p.name},</p>
            <p>Your target link: <a href="${targetUrl}">${targetUrl}</a></p>
            <p>Your report link: <a href="${reportUrl}">${reportUrl}</a></p>
            <p>Keep them secret — good luck!</p>
          `,
          text: `Hi ${p.name}\nTarget: ${targetUrl}\nReport: ${reportUrl}`,
        });
      } catch (err) {
        console.error("sendMail failed for", p.email, err);
      }
    }
    return NextResponse.json({
      ok: true,
      roundId: round.id,
      targetTokens, // hunterId -> token for /api/target
      reportTokens, // hunterId -> token for /api/report
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

