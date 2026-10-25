import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests");
  }
}

export async function clientKey(action: string) {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headerStore.get("x-real-ip") || "unknown";
  const salt = process.env.AUTH_SECRET || "rate-limit";
  const hash = createHash("sha256").update(`${salt}:${ip}`).digest("hex");
  return `${action}:${hash}`;
}

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const row = await tx.rateLimit.findUnique({ where: { key } });
    if (!row || now.getTime() - row.windowStart.getTime() >= windowMs) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return;
    }
    if (row.count >= limit) throw new RateLimitError();
    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  });
}
