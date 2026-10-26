export const SESSION_COOKIE = "whyus_admin";
export const TAGS = {
  events: "events",
  speakers: "speakers",
  settings: "settings",
  pages: "pages",
} as const;

export const HOLD_MINUTES_DEFAULT = 30;
export const MAX_UPLOAD_BYTES = 2_000_000;

export const EVENT_CATEGORIES = [
  "Business conference",
  "Technology summit",
  "Professional workshop",
  "Entrepreneurship",
  "Leadership seminar",
  "Networking",
  "Corporate",
  "Education",
  "Creative industry",
  "Private experience",
] as const;

export const SESSION_CATEGORIES = [
  "Keynote",
  "Panel",
  "Workshop",
  "Networking",
  "Break",
  "Arrival",
  "Closing",
] as const;

export const INQUIRY_CATEGORIES = [
  { value: "GENERAL", label: "General inquiry" },
  { value: "TICKETS", label: "Tickets and registration" },
  { value: "SPONSORSHIP", label: "Sponsorship" },
  { value: "SPEAKING", label: "Speaking opportunities" },
  { value: "PARTNERSHIPS", label: "Partnerships" },
  { value: "ACCESSIBILITY", label: "Accessibility" },
] as const;

export const FORMAT_LABELS: Record<string, string> = {
  IN_PERSON: "In person",
  ONLINE: "Online",
  HYBRID: "Hybrid",
};

export const CURRENCIES = ["GHS", "NGN", "USD", "GBP", "EUR", "ZAR", "KES"] as const;

export const BENEFITS = [
  {
    title: "Meaningful connections",
    description: "Meet people who are building, leading, and looking for the same kind of serious conversation.",
  },
  {
    title: "Inspiring speakers",
    description: "Hear from practitioners whose work is worth the room, with time left for real questions.",
  },
  {
    title: "Practical knowledge",
    description: "Leave with ideas you can use, not a folder of slides you will never open again.",
  },
  {
    title: "Curated experiences",
    description: "Programmes shaped around the people in the room, from summits to private gatherings.",
  },
  {
    title: "Professional community",
    description: "A place for attendees, speakers, sponsors, and partners to keep finding one another.",
  },
  {
    title: "Opportunities for growth",
    description: "Conferences, workshops, and seminars designed to turn a good idea into the next step.",
  },
] as const;
