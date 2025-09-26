import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function makeToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function createEmailToken(opts: {
  playerId?: string | null;
  purpose: "verify" | "target" | "report" | "confirm_elim" | "dispute_elim";
  ttlMinutes?: number; 
  reportId?: string | null;
}) {
  const token = makeToken();
  const ttl = (opts.ttlMinutes ?? 120) * 60 * 1000; // ms
  const expiresAt = new Date(Date.now() + ttl);

  await prisma.emailToken.create({
    data: {
      token,
      purpose: opts.purpose,
      playerId: opts.playerId ?? null,
      reportId: opts.reportId ?? null,
      expiresAt,
      consumed: false,
    },
  });

  return token;
}

export async function validateToken(
  token: string,
  purpose: "verify" | "target" | "report" | "confirm_elim" | "dispute_elim"
) {
  if (!token) return null;
  const row = await prisma.emailToken.findUnique({ where: { token } });
  const now = new Date();
  if (!row) return null;
  if (row.purpose !== purpose) return null;
  if (row.consumed) return null;
  if (row.expiresAt < now) return null;
  return row; // contains playerId, purpose, expiresAt, etc.
}

// Mark a token as consumed (one-time use)
export async function consumeToken(token: string) {
  await prisma.emailToken.update({
    where: { token },
    data: { consumed: true },
  });
}