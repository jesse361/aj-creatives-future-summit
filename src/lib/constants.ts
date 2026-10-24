export const EVENT_SLUG = "future-summit-2027";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/speakers", label: "Speakers" },
  { href: "/schedule", label: "Schedule" },
  { href: "/tickets", label: "Tickets" },
  { href: "/contact", label: "Contact" },
] as const;

export const INQUIRY_CATEGORIES = [
  { value: "GENERAL", label: "General inquiry" },
  { value: "TICKETS", label: "Tickets and registration" },
  { value: "SPONSORSHIP", label: "Sponsorship" },
  { value: "SPEAKING", label: "Speaking opportunities" },
  { value: "PARTNERSHIPS", label: "Partnerships" },
  { value: "ACCESSIBILITY", label: "Accessibility" },
] as const;

export const SESSION_CATEGORIES = [
  "Registration",
  "Keynote",
  "Panel",
  "Workshop",
  "Networking",
  "Break",
  "Remarks",
] as const;

export const EVENT_FORMATS = [
  { value: "TBD", label: "Format to be confirmed" },
  { value: "IN_PERSON", label: "In person" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "HYBRID", label: "Hybrid" },
] as const;

export const REGISTRATION_STATUSES = ["REQUESTED", "CONFIRMED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["NOT_REQUIRED", "UNPAID", "PAID", "FAILED"] as const;

export function formatLabel(value: string) {
  return EVENT_FORMATS.find((item) => item.value === value)?.label ?? "Format to be confirmed";
}

export function inquiryLabel(value: string) {
  return INQUIRY_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}
