// app/api/report/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken, createEmailToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { token} = await req.json();

    if (!token) {
      return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
    }

    // 1) validate report token (belongs to hunter)
    const t = await validateToken(token, "report");
    if (!t || !t.playerId) {
      return NextResponse.json({ ok: false, error: "invalid or expired token" }, { status: 400 });
    }
    const hunterId = t.playerId;

    // 2) fetch hunter's active assignment (hunter -> target)
    const hunterEdge = await prisma.assignment.findFirst({
      where: { hunterId, active: true },
    });
    if (!hunterEdge) {
      return NextResponse.json({ ok: false, error: "no active assignment for hunter" }, { status: 400 });
    }
    const { roundId, targetId } = hunterEdge;

    // 3) fetch the target's edge (target -> targetTarget) to rewire the ring
    const targetEdge = await prisma.assignment.findFirst({
      where: { roundId, hunterId: targetId, active: true },
    });
    if (!targetEdge) {
      return NextResponse.json({ ok: false, error: "target edge not found" }, { status: 400 });
    }

    // 4) run everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // a) create report (auto-approve)
      const report = await tx.report.create({
        data: {
          roundId,
          hunterId,
          targetId,
          status: "approved",
        },
        select: { id: true },
      });

      // b) mark target eliminated
      await tx.player.update({
        where: { id: targetId },
        data: { status: "eliminated" },
      });

      // c) remove current active edges for hunter and target
      await tx.assignment.delete({ where: { id: targetEdge.id } });
      await tx.assignment.delete({ where: { id: hunterEdge.id } });

      // d) if more than 2 players remain, create a new edge hunter -> targetTarget
      const remainingActivePlayers = await tx.player.count({
        where: { status: { not: "eliminated" } },
      });

      let newAssignmentId: string | null = null;
      if (remainingActivePlayers > 1) {
        const newA = await tx.assignment.create({
          data: {
            roundId,
            hunterId,
            targetId: targetEdge.targetId,
            active: true,
          },
          select: { id: true },
        });
        newAssignmentId = newA.id;
      } else {
        // auto-end the round when 1 remain
        await tx.round.update({
          where: { id: roundId },
          data: { status: "ended" },
        });
      }

      // e) consume the report token so it can't be reused
      await tx.emailToken.update({
        where: { token },
        data: { consumed: true },
      });

      return {
        reportId: report.id,
        nextTargetId: remainingActivePlayers > 1 ? targetEdge.targetId : null,
        roundEnded: remainingActivePlayers <= 1,
        newAssignmentId,
      };
    });


    try {
  const [hunterPlayer, targetPlayer] = await Promise.all([
    prisma.player.findUnique({
      where: { id: hunterId },
      select: { name: true, email: true },
    }),
    prisma.player.findUnique({
      where: { id: targetId },
      select: { name: true, email: true },
    }),
  ]);

//elimination email
  if (targetPlayer?.email) {
    const eliminatorName = hunterPlayer?.name ?? "another player";
    const subject = "You’ve been eliminated";
    const html = `
      <p>Hi ${targetPlayer.name},</p>
      <p>You have been <strong>eliminated</strong> by <strong>${eliminatorName}</strong>.</p>
      <p>Thanks for playing!</p>
    `;
    const text =
      `Hi ${targetPlayer.name}\n` +
      `You have been eliminated by ${eliminatorName}.\n` +
      `Thanks for playing!`;

    await sendMail({
      to: targetPlayer.email,
      subject,
      html,
      text,
    });
  }
} catch (err) {
  console.error("Failed to send elimination email:", err);
}


// game end emails
if (result.roundEnded) {
  try {
    const players = await prisma.player.findMany({
      select: { id: true, name: true, email: true, status: true },
    });

    const winner = players.find((p) => p.status !== "eliminated");

    for (const p of players) {
      if (!p.email) continue;
      try {
        await sendMail({
          to: p.email,
          subject: "The game has ended",
          html: `
            <p>Hi ${p.name},</p>
            <p>The Assassin game is now over.</p>
            ${
              p.id === winner?.id
                ? `<p><strong>Congratulations, you are the last survivor!</strong></p>`
                : `<p>You were eliminated, but thanks for playing!</p>`
            }
          `,
          text:
            `Hi ${p.name}\n` +
            `The Assassin game is now over.\n` +
            (p.id === winner?.id
              ? "Congratulations, you are the last survivor!"
              : "You were eliminated, but thanks for playing!"),
        });
      } catch (err) {
        console.error("Failed to send end email:", p.email, err);
      }
    }
  } catch (err) {
    console.error("Game end email block failed:", err);
  }
}

let newReportToken: string | null = null;
let newTargetToken: string | null = null;
if (!result.roundEnded) {
  // create both tokens
  [newReportToken, newTargetToken] = await Promise.all([
    createEmailToken({
      playerId: hunterId,
      purpose: "report",
      ttlMinutes: 60 * 24 * 7,
    }),
    createEmailToken({
      playerId: hunterId,
      purpose: "target",
      ttlMinutes: 60 * 24 * 7,
    }),
  ]);

  // send both links via email
  const hunter = await prisma.player.findUnique({ where: { id: hunterId } });
  if (hunter) {
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const reportUrl = `${baseUrl}/report?token=${newReportToken}`;
    const targetUrl = `${baseUrl}/target?token=${newTargetToken}`;
    try {
      await sendMail({
        to: hunter.email,
        subject: "Your updated game links",
        html: `
          <p>Hi ${hunter.name},</p>
          <p>Your elimination has been processed. Here are your updated links:</p>
          <ul>
            <li>Report link: <a href="${reportUrl}">${reportUrl}</a></li>
            <li>Target link: <a href="${targetUrl}">${targetUrl}</a></li>
          </ul>
        `,
        text: `Hi ${hunter.name}\nReport link: ${reportUrl}\nTarget link: ${targetUrl}`,
      });
    } catch (err) {
      console.error("sendMail failed for", hunter.email, err);
    }
  }
}

    return NextResponse.json({ ok: true, ...result, newReportToken, newTargetToken });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e?.message || e)  }, { status: 400 });
  }
}