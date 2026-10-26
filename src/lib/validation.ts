import { z } from "zod";
import { CURRENCIES } from "@/lib/constants";

export const PHONE_PATTERN = /^[0-9+().\-\s]{7,20}$/;

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const socialLinkSchema = z.object({
  label: trimmed(1, 40),
  url: z.string().trim().url().max(300),
});

export const faqPairSchema = z.object({
  question: trimmed(3, 200),
  answer: trimmed(3, 2000),
});

export const registrationSchema = z.object({
  eventId: z.string().trim().min(1).max(80),
  ticketTypeId: z.string().trim().min(1).max(80),
  quantity: z.coerce.number().int().min(1).max(50),
  fullName: trimmed(2, 120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).default(""),
  organization: optionalText(160),
  termsAccepted: z.boolean(),
  idempotencyKey: z.string().trim().min(8).max(80),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const contactSchema = z.object({
  name: trimmed(2, 120),
  email: z.string().trim().email().max(200),
  category: z.enum(["GENERAL", "TICKETS", "SPONSORSHIP", "SPEAKING", "PARTNERSHIPS", "ACCESSIBILITY"]),
  subject: trimmed(3, 160),
  message: trimmed(10, 4000),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email().max(200),
  consent: z.literal(true),
});

export const eventSchema = z
  .object({
    title: trimmed(3, 160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
    shortDescription: trimmed(10, 280),
    fullDescription: trimmed(20, 8000),
    category: trimmed(2, 80),
    coverImage: z.string().trim().max(500).default(""),
    coverAlt: z.string().trim().max(200).default(""),
    startDate: z.string().trim().min(1),
    endDate: z.string().trim().min(1),
    timezone: trimmed(1, 80),
    venueName: optionalText(160),
    venueAddress: optionalText(300),
    city: optionalText(80),
    country: optionalText(80),
    eventFormat: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]),
    onlineDetails: optionalText(2000),
    travelInfo: optionalText(2000),
    accessibilityInfo: optionalText(2000),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]),
    registrationOpen: z.boolean(),
    isDemonstration: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate <= value.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "The end must be after the start." });
    }
  });

export const speakerSchema = z.object({
  name: trimmed(2, 120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  professionalTitle: trimmed(2, 160),
  organization: optionalText(160),
  biography: trimmed(20, 4000),
  portrait: z.string().trim().max(500).default(""),
  portraitAlt: optionalText(200),
  expertise: z.array(trimmed(1, 40)).max(12),
  socialLinks: z.array(socialLinkSchema).max(6),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  featured: z.boolean(),
  isDemonstration: z.boolean(),
});

export const sessionSchema = z
  .object({
    eventId: z.string().trim().min(1),
    title: trimmed(2, 160),
    description: optionalText(2000),
    startTime: z.string().trim().min(1),
    endTime: z.string().trim().min(1),
    room: optionalText(80),
    category: trimmed(2, 40),
    displayOrder: z.coerce.number().int().min(0).max(999),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    speakerIds: z.array(z.string().trim().min(1)).max(12),
  })
  .superRefine((value, ctx) => {
    if (value.endTime <= value.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "The session must end after it starts." });
    }
  });

export const ticketSchema = z
  .object({
    eventId: z.string().trim().min(1),
    name: trimmed(2, 80),
    description: optionalText(500),
    price: z.string().trim(),
    currency: z.string().trim().length(3),
    capacity: z.coerce.number().int().min(0).max(100000),
    salesStart: z.string().trim().default(""),
    salesEnd: z.string().trim().default(""),
    minimumQuantity: z.coerce.number().int().min(1).max(50),
    maximumQuantity: z.coerce.number().int().min(1).max(50),
    benefits: z.array(trimmed(1, 160)).max(12),
    status: z.enum(["ACTIVE", "DISABLED"]),
    isDemonstration: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!CURRENCIES.includes(value.currency.toUpperCase() as (typeof CURRENCIES)[number]) && !/^[A-Z]{3}$/.test(value.currency.toUpperCase())) {
      ctx.addIssue({ code: "custom", path: ["currency"], message: "Use a three-letter currency code." });
    }
    if (value.maximumQuantity < value.minimumQuantity) {
      ctx.addIssue({ code: "custom", path: ["maximumQuantity"], message: "Maximum quantity must be at least the minimum." });
    }
  });

export const sponsorSchema = z.object({
  name: trimmed(2, 120),
  logo: z.string().trim().max(500).default(""),
  logoAlt: optionalText(200),
  website: z.string().trim().max(300).default(""),
  tier: trimmed(2, 40),
  displayOrder: z.coerce.number().int().min(0).max(999),
  status: z.enum(["DRAFT", "APPROVED", "HIDDEN"]),
});

export const inquiryUpdateSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["NEW", "REVIEWED", "CLOSED"]),
  notes: optionalText(2000),
});

export const settingsSchema = z.object({
  brandName: trimmed(2, 80),
  legalName: trimmed(2, 160),
  tagline: trimmed(2, 180),
  secondaryTagline: trimmed(2, 180),
  logoUrl: z.string().trim().max(500).default(""),
  contactEmail: z.string().trim().email().or(z.literal("")).default(""),
  contactPhone: optionalText(40),
  address: optionalText(300),
  socialLinks: z.array(socialLinkSchema).max(8),
  defaultCurrency: z.string().trim().length(3),
  announcementEnabled: z.boolean(),
  announcement: optionalText(240),
  footerContent: optionalText(500),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  registrationHoldMinutes: z.coerce.number().int().min(5).max(120),
});

export const pageSchema = z.object({
  key: z.string().trim().min(2).max(40),
  title: trimmed(2, 160),
  body: trimmed(2, 12000),
});

export const testimonialSchema = z.object({
  quote: trimmed(10, 600),
  name: trimmed(2, 120),
  role: optionalText(160),
  eventName: optionalText(160),
  status: z.enum(["DRAFT", "APPROVED", "HIDDEN"]),
  displayOrder: z.coerce.number().int().min(0).max(999),
});

export const faqSchema = z.object({
  question: trimmed(5, 200),
  answer: trimmed(5, 2000),
  category: trimmed(2, 40),
  displayOrder: z.coerce.number().int().min(0).max(999),
  published: z.boolean(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(200),
  nextPassword: z.string().min(12).max(200),
});

export function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function checkbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function socialsFromForm(formData: FormData) {
  const labels = formData.getAll("socialLabel").map(String);
  const urls = formData.getAll("socialUrl").map(String);
  return labels
    .map((label, index) => ({ label: label.trim(), url: (urls[index] ?? "").trim() }))
    .filter((link) => link.label || link.url);
}
