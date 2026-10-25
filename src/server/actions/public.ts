"use server";

import { randomUUID } from "node:crypto";
import { redirect, unstable_rethrow } from "next/navigation";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { PUBLIC_EVENT_TAG } from "@/lib/constants";
import { contactSchema, registrationSchema } from "@/lib/schemas";
import { registerAttendee, RegistrationError } from "@/lib/registration";
import { assertRateLimit, clientKey, RateLimitError } from "@/lib/rate-limit";
import { sendInquiryEmail, sendRegistrationEmail } from "@/lib/email";
import { createCheckout } from "@/lib/payments";
import type { ContactFormState, RegistrationFormState } from "@/lib/types";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export async function registerAction(_previous: RegistrationFormState, formData: FormData): Promise<RegistrationFormState> {
  if (String(formData.get("companyWebsite") ?? "").trim()) {
    return { ok: false, message: "Your submission could not be accepted." };
  }

  try {
    await assertRateLimit(await clientKey("register"), 8, 15 * 60 * 1000);
    const rawKey = String(formData.get("idempotencyKey") ?? "");
    const parsed = registrationSchema.safeParse({
      ticketTypeId: formData.get("ticketTypeId"),
      quantity: formData.get("quantity"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? "",
      organization: formData.get("organization") ?? "",
      jobTitle: formData.get("jobTitle") ?? "",
      notes: formData.get("notes") ?? "",
      termsAccepted: formData.get("termsAccepted") === "on",
      eligibilityAccepted: formData.get("eligibilityAccepted") === "on",
      idempotencyKey: rawKey || randomUUID(),
    });
    if (!parsed.success) {
      return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    }

    const result = await registerAttendee(parsed.data);
    if (result.created) {
      const emailStatus = await sendRegistrationEmail({
        reference: result.registration.reference,
        email: result.registration.email,
        attendeeName: result.registration.attendeeName,
        quantity: result.registration.quantity,
        status: result.registration.status,
        eventName: result.eventName,
      });
      await prisma.registration.update({ where: { id: result.registration.id }, data: { emailStatus } });
      updateTag(PUBLIC_EVENT_TAG);
    }

    if (result.registration.status === "PENDING_PAYMENT") {
      const checkoutUrl = await createCheckout({
        id: result.registration.id,
        reference: result.registration.reference,
        email: result.registration.email,
        quantity: result.registration.quantity,
        amountCents: result.registration.amountCents,
        currency: result.registration.currency,
        ticketName: result.ticketName,
        eventName: result.eventName,
      });
      if (checkoutUrl) redirect(checkoutUrl);
    }

    redirect(`/registration/${result.registration.reference}`);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) {
      return { ok: false, message: "Too many registration attempts. Please wait and try again." };
    }
    if (error instanceof RegistrationError) return { ok: false, message: error.message };
    return { ok: false, message: "We could not save your registration. Please try again." };
  }
}

export async function submitInquiry(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  if (String(formData.get("companyWebsite") ?? "").trim()) {
    return { status: "error", message: "Your message could not be accepted." };
  }

  try {
    await assertRateLimit(await clientKey("contact"), 5, 15 * 60 * 1000);
    const parsed = contactSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      category: formData.get("category"),
      message: formData.get("message"),
    });
    if (!parsed.success) {
      return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    }

    const event = await prisma.event.findFirst({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" } });
    if (!event) return { status: "error", message: "The event is not open for inquiries yet." };

    await prisma.contactInquiry.create({
      data: {
        eventId: event.id,
        name: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        category: parsed.data.category,
        message: parsed.data.message,
        status: "NEW",
      },
    });
    await sendInquiryEmail({
      name: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      category: parsed.data.category,
      message: parsed.data.message,
    });
    return { status: "success", message: "Your message has been saved. The organizer can read it from the admin inbox." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) {
      return { status: "error", message: "Too many messages. Please wait and try again." };
    }
    return { status: "error", message: "We could not save your message. Please try again." };
  }
}
