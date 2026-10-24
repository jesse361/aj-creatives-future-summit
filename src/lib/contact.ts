import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { zodFieldErrors } from "@/lib/security";
import { contactSchema, type ContactInput } from "@/lib/validation";

export async function createInquiry(input: ContactInput, options: { ip: string }) {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, errors: zodFieldErrors(parsed.error.issues) };
  }
  if (parsed.data.companyWebsite.trim()) {
    return { ok: false as const, errors: { form: "Unable to send this message." } };
  }

  const limited = rateLimit(`contact:${options.ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return { ok: false as const, errors: { form: "Too many messages. Please wait a while and try again." } };
  }

  const inquiry = await prisma.contactInquiry.create({
    data: {
      name: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      category: parsed.data.category,
      message: parsed.data.message,
      status: "NEW",
    },
  });

  const settings = await prisma.eventSettings.findUnique({ where: { id: "default" } });
  let forwarded = false;
  if (settings?.contactEmail) {
    const result = await sendEmail({
      to: settings.contactEmail,
      subject: `Summit inquiry: ${parsed.data.category}`,
      text: `${parsed.data.fullName} <${parsed.data.email}>\n\n${parsed.data.message}`,
    });
    forwarded = result === "SENT";
  }

  return { ok: true as const, id: inquiry.id, forwarded };
}
