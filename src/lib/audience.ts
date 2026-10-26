import { prisma } from "@/lib/db";
import { createToken } from "@/lib/reference";
import type { contactSchema } from "@/lib/validation";
import type { z } from "zod";

export async function createInquiry(input: z.infer<typeof contactSchema>) {
  return prisma.contactInquiry.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      category: input.category,
      subject: input.subject,
      message: input.message,
    },
  });
}

export async function subscribeNewsletter(email: string) {
  const normalized = email.toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
  if (existing && existing.subscriptionStatus === "SUBSCRIBED") {
    return { status: "exists" as const, subscriber: existing };
  }
  if (existing) {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        subscriptionStatus: "SUBSCRIBED",
        consentStatus: "GRANTED",
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    });
    return { status: "resubscribed" as const, subscriber };
  }
  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email: normalized,
      consentStatus: "GRANTED",
      subscriptionStatus: "SUBSCRIBED",
      unsubscribeToken: createToken(),
    },
  });
  return { status: "created" as const, subscriber };
}

export async function unsubscribeNewsletter(token: string) {
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!existing) return { ok: false as const };
  if (existing.subscriptionStatus === "UNSUBSCRIBED") return { ok: true as const, already: true };
  await prisma.newsletterSubscriber.update({
    where: { id: existing.id },
    data: { subscriptionStatus: "UNSUBSCRIBED", consentStatus: "WITHDRAWN", unsubscribedAt: new Date() },
  });
  return { ok: true as const, already: false };
}
