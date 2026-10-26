"use server";

import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/constants";
import { writeAudit } from "@/lib/audit";
import { sendRegistrationEmail } from "@/lib/email";
import { markRefunded } from "@/lib/payments";
import { refundPaystack } from "@/lib/paystack";
import { cancelRegistrationRecord } from "@/lib/registration";
import { isHttpUrl, isSafeImageSrc } from "@/lib/safe-url";
import { checkbox, fieldErrors, inquiryUpdateSchema, sponsorSchema } from "@/lib/validation";
import { guard } from "@/server/actions/guard";
import type { FormState } from "@/lib/types";

export async function saveSponsor(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = sponsorSchema.safeParse({
    name: formData.get("name"),
    logo: formData.get("logo") ?? "",
    logoAlt: formData.get("logoAlt") ?? "",
    website: formData.get("website") ?? "",
    tier: formData.get("tier"),
    displayOrder: formData.get("displayOrder") ?? 0,
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: "Check the sponsor.", fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.logo && !isSafeImageSrc(parsed.data.logo)) return { ok: false, message: "Use a site path or https logo." };
  if (parsed.data.website && !isHttpUrl(parsed.data.website)) return { ok: false, message: "Website must be an http or https link." };
  if (parsed.data.status === "APPROVED" && !parsed.data.name.trim()) return { ok: false, message: "An approved sponsor needs a name." };
  const id = String(formData.get("id") ?? "");
  const saved = id ? await prisma.sponsor.update({ where: { id }, data: parsed.data }) : await prisma.sponsor.create({ data: parsed.data });
  await writeAudit(admin, id ? "sponsor.update" : "sponsor.create", "Sponsor", saved.id, `${saved.name} ${saved.status}`);
  updateTag(TAGS.events);
  return { ok: true, message: parsed.data.status === "APPROVED" ? "Sponsor approved and visible on the site." : "Sponsor saved. It stays hidden until approved." };
}

export async function updateInquiry(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = inquiryUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Check the inquiry." };
  await prisma.contactInquiry.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status, notes: parsed.data.notes } });
  await writeAudit(admin, "inquiry.update", "ContactInquiry", parsed.data.id, parsed.data.status);
  return { ok: true, message: "Inquiry updated." };
}

export async function cancelRegistrationAction(formData: FormData) {
  const { admin, error } = await guard("commerce");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  await cancelRegistrationRecord(id);
  await writeAudit(admin, "registration.cancel", "Registration", id, "Registration cancelled and inventory released");
  updateTag(TAGS.events);
}

export async function resendRegistrationAction(formData: FormData) {
  const { admin, error } = await guard("commerce");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  const registration = await prisma.registration.findUnique({ where: { id }, include: { event: true } });
  if (!registration) return;
  const emailStatus = await sendRegistrationEmail({
    reference: registration.reference,
    email: registration.attendeeEmail,
    attendeeName: registration.attendeeName,
    eventName: registration.event.title,
    status: registration.registrationStatus,
  });
  await prisma.registration.update({ where: { id }, data: { emailStatus } });
  await writeAudit(admin, "registration.resend", "Registration", id, emailStatus);
}

export async function refundPaymentAction(formData: FormData) {
  const { admin, error } = await guard("commerce");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment?.providerReference || payment.paymentStatus !== "SUCCESS") return;
  if (!checkbox(formData.get("confirmRefund"))) return;
  const refund = await refundPaystack(payment.providerReference);
  if (!refund.ok) {
    await writeAudit(admin, "payment.refund_failed", "Payment", id, refund.reason);
    return;
  }
  await markRefunded(payment.registrationId);
  await writeAudit(admin, "payment.refund", "Payment", id, payment.providerReference);
  updateTag(TAGS.events);
}
