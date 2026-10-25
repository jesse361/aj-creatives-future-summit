export const PUBLIC_EVENT_TAG = "event-public";
export const SESSION_COOKIE = "fs_session";
export const MAX_TICKETS_PER_ORDER = 8;

export const SESSION_CATEGORIES = [
  "Arrival",
  "Keynote",
  "Panel",
  "Break",
  "Workshop",
  "Networking",
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
  VIRTUAL: "Virtual",
  HYBRID: "Hybrid",
};

export const TIER_ORDER = ["Platinum", "Gold", "Silver", "Community", "Partner"];
