import { z } from "zod";
import { INQUIRY_CATEGORIES, MAX_TICKETS_PER_ORDER } from "@/lib/constants";

const phonePattern = /^[0-9+().\-\s]{7,40}$/;

export const registrationSchema = z
  .object({
    ticketTypeId: z.string().trim().min(1, "Select a ticket."),
    quantity: z.coerce.number().int().min(1, "Choose at least one ticket.").max(MAX_TICKETS_PER_ORDER),
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    email: z.string().trim().email("Enter a valid email address.").max(200),
    phone: z.string().trim().max(40).default(""),
    organization: z.string().trim().max(160).default(""),
    jobTitle: z.string().trim().max(160).default(""),
    notes: z.string().trim().max(500).default(""),
    termsAccepted: z.boolean(),
    eligibilityAccepted: z.boolean().default(false),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (!value.termsAccepted) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["termsAccepted"],
        message: "Agree to the terms and privacy notice to continue.",
      });
    }
    if (value.phone && !phonePattern.test(value.phone)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Enter a phone number using digits and standard symbols.",
      });
    }
  });

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  category: z.enum(INQUIRY_CATEGORIES.map((item) => item.value) as [string, ...string[]]),
  message: z.string().trim().min(10, "Enter a message of at least 10 characters.").max(2000),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const PHONE_PATTERN = phonePattern;
