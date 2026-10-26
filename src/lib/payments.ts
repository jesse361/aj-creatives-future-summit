import { prisma } from "@/lib/db";

export async function applyVerifiedPayment(input: { reference: string; amount: number; currency: string; providerReference: string }) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { reference: input.reference },
      include: { items: true, payment: true },
    });
    if (!registration || !registration.payment) return { ok: false as const, reason: "missing" as const };
    if (registration.payment.paymentStatus === "SUCCESS" && registration.registrationStatus === "CONFIRMED") {
      return { ok: true as const, reason: "already-paid" as const, registration };
    }
    if (registration.totalAmount !== input.amount || registration.currency.toUpperCase() !== input.currency.toUpperCase()) {
      return { ok: false as const, reason: "mismatch" as const };
    }
    if (registration.registrationStatus !== "PENDING_PAYMENT") {
      return { ok: false as const, reason: "not-pending" as const };
    }
    const claimed = await tx.registration.updateMany({
      where: { id: registration.id, registrationStatus: "PENDING_PAYMENT" },
      data: { registrationStatus: "CONFIRMED", holdExpiresAt: null },
    });
    if (claimed.count !== 1) return { ok: true as const, reason: "already-paid" as const, registration };
    for (const item of registration.items) {
      const ticket = await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { reserved: { decrement: item.quantity }, sold: { increment: item.quantity } },
      });
      if (ticket.reserved < 0 || ticket.sold < 0) throw new Error("Inventory imbalance");
    }
    await tx.payment.update({
      where: { registrationId: registration.id },
      data: {
        paymentStatus: "SUCCESS",
        providerReference: input.providerReference,
        paidAt: new Date(),
        failureReason: "",
      },
    });
    return { ok: true as const, reason: "paid" as const, registration };
  });
}

export async function applyFailedPayment(reference: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { reference },
      include: { items: true, payment: true },
    });
    if (!registration || !registration.payment) return { ok: false as const, reason: "missing" as const };
    if (registration.registrationStatus === "CONFIRMED" || registration.payment.paymentStatus === "SUCCESS") {
      return { ok: false as const, reason: "already-paid" as const };
    }
    const claimed = await tx.registration.updateMany({
      where: { id: registration.id, registrationStatus: "PENDING_PAYMENT" },
      data: { registrationStatus: "FAILED", holdExpiresAt: null },
    });
    if (claimed.count !== 1) return { ok: false as const, reason: "not-pending" as const };
    for (const item of registration.items) {
      const ticket = await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { reserved: { decrement: item.quantity } },
      });
      if (ticket.reserved < 0) throw new Error("Inventory imbalance");
    }
    await tx.payment.update({
      where: { registrationId: registration.id },
      data: { paymentStatus: "FAILED", failureReason: reason.slice(0, 300) },
    });
    return { ok: true as const };
  });
}

export async function releaseExpiredHolds(now = new Date()) {
  const expired = await prisma.registration.findMany({
    where: { registrationStatus: "PENDING_PAYMENT", holdExpiresAt: { lt: now } },
    include: { items: true },
    take: 50,
  });
  let released = 0;
  for (const registration of expired) {
    const did = await prisma.$transaction(async (tx) => {
      const claimed = await tx.registration.updateMany({
        where: { id: registration.id, registrationStatus: "PENDING_PAYMENT" },
        data: { registrationStatus: "EXPIRED", holdExpiresAt: null },
      });
      if (claimed.count !== 1) return false;
      for (const item of registration.items) {
        const ticket = await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { reserved: { decrement: item.quantity } },
        });
        if (ticket.reserved < 0) throw new Error("Inventory imbalance");
      }
      await tx.payment.updateMany({
        where: { registrationId: registration.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "CANCELLED", failureReason: "Hold expired" },
      });
      return true;
    });
    if (did) released += 1;
  }
  return released;
}

export async function markRefunded(registrationId: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
      include: { items: true, payment: true },
    });
    if (!registration?.payment || registration.payment.paymentStatus !== "SUCCESS") return { ok: false as const, reason: "not-paid" as const };
    const claimed = await tx.payment.updateMany({
      where: { id: registration.payment.id, paymentStatus: "SUCCESS" },
      data: { paymentStatus: "REFUNDED", refundedAt: new Date() },
    });
    if (claimed.count !== 1) return { ok: false as const, reason: "not-paid" as const };
    if (registration.registrationStatus === "CONFIRMED") {
      for (const item of registration.items) {
        const ticket = await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { sold: { decrement: item.quantity } },
        });
        if (ticket.sold < 0) throw new Error("Inventory imbalance");
      }
      await tx.registration.update({ where: { id: registration.id }, data: { registrationStatus: "CANCELLED" } });
    }
    return { ok: true as const, reference: registration.reference };
  });
}
