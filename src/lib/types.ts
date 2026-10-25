export type SocialLink = { label: string; url: string };
export type WhyItem = { title: string; description: string };
export type Highlight = { title: string; description: string; image: string };

export type PublicSpeaker = {
  id: string;
  slug: string;
  name: string;
  jobTitle: string;
  organization: string;
  biography: string;
  portraitUrl: string;
  portraitIsSample: boolean;
  expertise: string[];
  socialLinks: SocialLink[];
  isSample: boolean;
  featured: boolean;
  sessionTitles: string[];
  categories: string[];
};

export type PublicSessionSpeaker = {
  name: string;
  slug: string;
  role: string;
};

export type PublicSession = {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  room: string;
  category: string;
  isBreak: boolean;
  isSample: boolean;
  speakers: PublicSessionSpeaker[];
};

export type PublicTicket = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  benefits: string[];
  capacity: number;
  sold: number;
  salesStart: string | null;
  salesEnd: string | null;
  isSample: boolean;
  eligibilityNote: string;
};

export type PublicSponsor = {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  tier: string;
  isSample: boolean;
};

export type PublicVenue = {
  confirmed: boolean;
  name: string;
  streetAddress: string;
  city: string;
  country: string;
  publicTransport: string;
  parking: string;
  accessibility: string;
  accommodation: string;
  directionsUrl: string;
  mapEmbedUrl: string;
  travelSummary: string;
  hoursLabel: string;
};

export type PublicSettings = {
  organizerName: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: SocialLink[];
  currency: string;
  currencyConfirmed: boolean;
  registrationOpen: boolean;
  phoneRequired: boolean;
  privacyNotice: string;
  termsText: string;
  whyAttend: WhyItem[];
  highlights: Highlight[];
  heroEyebrow: string;
  heroDescription: string;
  ctaHeadline: string;
  ctaDescription: string;
  nextEventUrl: string;
  nextEventLabel: string;
};

export type PublicEvent = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  startAt: string | null;
  endAt: string | null;
  datesConfirmed: boolean;
  timezone: string;
  timezoneConfirmed: boolean;
  format: string | null;
  formatConfirmed: boolean;
  heroImageUrl: string;
  venue: PublicVenue;
  settings: PublicSettings;
  speakers: PublicSpeaker[];
  sessions: PublicSession[];
  tickets: PublicTicket[];
  sponsors: PublicSponsor[];
};

export type RegistrationFormState = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};
