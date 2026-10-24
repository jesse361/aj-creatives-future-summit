import { z } from "zod";
import { INQUIRY_CATEGORIES } from "@/lib/constants";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const registrationSchema = z
  .object({
    ticketTypeId: z.string().trim().min(1, "Select a ticket."),
    quantity: z.coerce
      .number({ invalid_type_error: "Enter a ticket quantity." })
      .int("Enter a whole number of tickets.")
      .min(1, "Choose at least one ticket.")
      .max(10, "You can request up to 10 tickets at a time."),
    fullName: z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long."),
    email: z.string().trim().email("Enter a valid email address.").max(200),
    phone: optionalText(40),
    organization: optionalText(160),
    jobTitle: optionalText(160),
    dietaryNotes: optionalText(500),
    acceptTerms: z.boolean().refine((value) => value, "Agree to the event terms and privacy notice to continue."),
    idempotencyKey: z.string().trim().min(8, "Refresh the page and try again.").max(80),
    companyWebsite: optionalText(200),
  })
  .superRefine((value, context) => {
    if (value.phone && value.phone.replace(/\D/g, "").length < 7) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Enter a valid phone number.",
      });
    }
    if (value.companyWebsite.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["form"],
        message: "Unable to submit this registration.",
      });
    }
  });

export const contactSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    email: z.string().trim().email("Enter a valid email address.").max(200),
    category: z.enum(INQUIRY_CATEGORIES.map((item) => item.value) as [string, ...string[]], {
      errorMap: () => ({ message: "Choose an inquiry category." }),
    }),
    message: z.string().trim().min(10, "Enter a message of at least 10 characters.").max(4000, "Message is too long."),
    companyWebsite: optionalText(200),
  })
  .superRefine((value, context) => {
    if (value.companyWebsite.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["form"],
        message: "Unable to send this message.",
      });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
