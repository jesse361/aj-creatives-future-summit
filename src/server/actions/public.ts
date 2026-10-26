"use server";

import { randomUUID } from "node:crypto";
import { redirect, unstable_rethrow } from "next/navigation";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/constants";
import { createInquiry, subscribeNewsletter } from "@/lib/audience";
import { sendInquiryEmail, sendRegistrationEmail, syncNewsletterContact } from "@/lib/email";
import { initializePaystackCheckout, paystackConfigured } from "@/lib/paystack";
import { assertRateLimit, clientKey, RateLimitError } from "@/lib/rate-limit";
import { registerAttendee, RegistrationError } from "@/lib/registration";
import { contactSchema, fieldErrors, newsletterSchema, registrationSchema } from "@/lib/validation";
import type { FormState } from "@/lib/types";

function unavailable(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /Can't reach database|ECONNREFUSED|DATABASE_URL|PrismaClient/i.test(message);
}

export async function registerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  if (String(formData.get("companyWebsite") ?? "").trim()) return { ok: false, message: "Your submission could not be accepted." };
  try {
    await assertRateLimit(await clientKey("register"), 8, 15 * 60 * 1000);
    const parsed = registrationSchema.safeParse({
      eventId: formData.get("eventId"),
      ticketTypeId: formData.get("ticketTypeId"),
      quantity: formData.get("quantity"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? "",
      organization: formData.get("organization") ?? "",
      termsAccepted: formData.get("termsAccepted") === "on" || formData.get("termsAccepted") === "true",
      idempotencyKey: String(formData.get("idempotencyKey") ?? "") || randomUUID(),
    });
    if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const result = await registerAttendee(parsed.data, { paymentConfigured: paystackConfigured() });
    if (result.created) {
      const emailStatus = await sendRegistrationEmail({
        reference: result.registration.reference,
        email: result.registration.attendeeEmail,
        attendeeName: result.registration.attendeeName,
        eventName: result.eventName,
        status: result.registration.registrationStatus,
      });
      await prisma.registration.update({ where: { id: result.registration.id }, data: { emailStatus } });
      updateTag(TAGS.events);
    }
    if (result.registration.registrationStatus === "PENDING_PAYMENT") {
      const checkout = await initializePaystackCheckout({
        email: result.registration.attendeeEmail,
        amount: result.registration.totalAmount,
        currency: result.registration.currency,
        reference: result.registration.reference,
        registrationId: result.registration.id,
      });
      if (checkout.url) redirect(checkout.url);
      redirect(`/register/success?reference=${encodeURIComponent(result.registration.reference)}`);
    }
    redirect(`/register/success?reference=${encodeURIComponent(result.registration.reference)}`);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RegistrationError) return { ok: false, message: error.message };
    if (error instanceof RateLimitError) return { ok: false, message: "Too many attempts. Please wait and try again." };
    if (unavailable(error)) return { ok: false, message: "The database is unavailable. Nothing was saved." };
    return { ok: false, message: "Registration could not be completed." };
  }
}

export async function contactAction(_previous: FormState, formData: FormData): Promise<FormState> {
  if (String(formData.get("companyWebsite") ?? "").trim()) return { ok: false, message: "Your message could not be accepted." };
  try {
    await assertRateLimit(await clientKey("contact"), 5, 15 * 60 * 1000);
    const parsed = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      category: formData.get("category"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    });
    if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    await createInquiry(parsed.data);
    await sendInquiryEmail(parsed.data);
    return { ok: true, message: "Your message has been received. We will reply using the email you provided." };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, message: "Too many messages. Please wait and try again." };
    if (unavailable(error)) return { ok: false, message: "The database is unavailable. Your message was not saved." };
    return { ok: false, message: "Your message could not be sent." };
  }
}

export async function newsletterAction(_previous: FormState, formData: FormData): Promise<FormState> {
  if (String(formData.get("companyWebsite") ?? "").trim()) return { ok: false, message: "Subscription could not be accepted." };
  try {
    await assertRateLimit(await clientKey("newsletter"), 5, 15 * 60 * 1000);
    const parsed = newsletterSchema.safeParse({
      email: formData.get("email"),
      consent: formData.get("consent") === "on" || formData.get("consent") === "true",
    });
    if (!parsed.success) return { ok: false, message: "Enter your email and confirm you want to hear from WHY US.", fieldErrors: fieldErrors(parsed.error) };
    const result = await subscribeNewsletter(parsed.data.email);
    await syncNewsletterContact(result.subscriber.email, false);
    if (result.status === "exists") return { ok: true, message: "This email is already subscribed." };
    return { ok: true, message: "You are subscribed. You can unsubscribe at any time." };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, message: "Too many attempts. Please wait and try again." };
    if (unavailable(error)) return { ok: false, message: "The database is unavailable. You were not subscribed." };
    return { ok: false, message: "Subscription could not be saved." };
  }
}
