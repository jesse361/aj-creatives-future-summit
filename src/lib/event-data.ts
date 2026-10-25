import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PUBLIC_EVENT_TAG, TIER_ORDER } from "@/lib/constants";
import { demoPublishedEvent } from "@/lib/demo-event";
import { defaultHighlights, defaultPrivacy, defaultTerms, defaultWhyAttend } from "@/lib/defaults";
import { isHttpUrl } from "@/lib/safe-url";
import type { PublicEvent, PublicSettings, PublicVenue } from "@/lib/types";

const stringArray = z.array(z.string());
const socialArray = z.array(z.object({ label: z.string(), url: z.string() }));
const whyArray = z.array(z.object({ title: z.string(), description: z.string() }));
const highlightArray = z.array(z.object({ title: z.string(), description: z.string(), image: z.string() }));

function readJson<T>(value: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export async function getPublishedEvent(): Promise<PublicEvent | null> {
  "use cache";
  cacheTag(PUBLIC_EVENT_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  try {
    return (await readPublishedEventFromDatabase()) ?? demoPublishedEvent();
  } catch (error) {
    console.error("Event database is unavailable. Showing demonstration content.", error);
    return demoPublishedEvent();
  }
}

async function readPublishedEventFromDatabase(): Promise<PublicEvent | null> {
  const event = await prisma.event.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    include: {
      venue: true,
      settings: true,
      speakers: { where: { published: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
      sessions: {
        where: { published: true },
        orderBy: [{ startAt: "asc" }, { displayOrder: "asc" }],
        include: { speakers: { include: { speaker: true } } },
      },
      ticketTypes: { where: { active: true }, orderBy: { displayOrder: "asc" } },
      sponsors: { where: { active: true }, orderBy: { displayOrder: "asc" } },
    },
  });

  if (!event) return null;

  const sessions = event.sessions
    .filter((session) => session.endAt > session.startAt)
    .map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      startAt: session.startAt.toISOString(),
      endAt: session.endAt.toISOString(),
      room: session.room,
      category: session.category,
      isBreak: session.isBreak,
      isSample: session.isSample,
      speakers: session.speakers
        .filter((link) => link.speaker.published)
        .map((link) => ({
          name: link.speaker.name,
          slug: link.speaker.slug,
          role: link.role,
        })),
    }));

  const speakerMeta = new Map<string, { titles: string[]; categories: string[] }>();
  for (const session of sessions) {
    for (const speaker of session.speakers) {
      const current = speakerMeta.get(speaker.slug) ?? { titles: [], categories: [] };
      current.titles.push(session.title);
      if (!current.categories.includes(session.category)) current.categories.push(session.category);
      speakerMeta.set(speaker.slug, current);
    }
  }

  const settings: PublicSettings = {
    organizerName: event.settings?.organizerName || "AJ CREATIVES",
    contactEmail: event.settings?.contactEmail || "",
    contactPhone: event.settings?.contactPhone || "",
    socialLinks: readJson(event.settings?.socialLinks ?? "[]", socialArray, []).filter((link) => isHttpUrl(link.url)),
    currency: event.settings?.currency || "USD",
    currencyConfirmed: event.settings?.currencyConfirmed ?? false,
    registrationOpen: event.settings?.registrationOpen ?? false,
    phoneRequired: event.settings?.phoneRequired ?? false,
    privacyNotice: event.settings?.privacyNotice || defaultPrivacy,
    termsText: event.settings?.termsText || defaultTerms,
    whyAttend: readJson(event.settings?.whyAttend ?? "[]", whyArray, defaultWhyAttend),
    highlights: readJson(event.settings?.highlights ?? "[]", highlightArray, defaultHighlights),
    heroEyebrow: event.settings?.heroEyebrow || "AJ CREATIVES PRESENTS",
    heroDescription:
      event.settings?.heroDescription ||
      "Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future.",
    ctaHeadline: event.settings?.ctaHeadline || "BE PART OF WHAT COMES NEXT.",
    ctaDescription: event.settings?.ctaDescription || "Join the conversations, connections, and ideas shaping tomorrow.",
    nextEventUrl: event.settings?.nextEventUrl && isHttpUrl(event.settings.nextEventUrl) ? event.settings.nextEventUrl : "",
    nextEventLabel: event.settings?.nextEventLabel || "",
  };

  const venue: PublicVenue = {
    confirmed: event.venue?.confirmed ?? false,
    name: event.venue?.name ?? "",
    streetAddress: event.venue?.streetAddress ?? "",
    city: event.venue?.city ?? "",
    country: event.venue?.country ?? "",
    publicTransport: event.venue?.publicTransport ?? "",
    parking: event.venue?.parking ?? "",
    accessibility: event.venue?.accessibility ?? "",
    accommodation: event.venue?.accommodation ?? "",
    directionsUrl: event.venue?.directionsUrl && isHttpUrl(event.venue.directionsUrl) ? event.venue.directionsUrl : "",
    mapEmbedUrl: event.venue?.mapEmbedUrl ?? "",
    travelSummary: event.venue?.travelSummary ?? "",
    hoursLabel: event.venue?.hoursLabel ?? "",
  };

  const sponsors = [...event.sponsors].sort((a, b) => {
    const rank = (tier: string) => {
      const index = TIER_ORDER.indexOf(tier);
      return index === -1 ? 99 : index;
    };
    return rank(a.tier) - rank(b.tier) || a.displayOrder - b.displayOrder;
  });

  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    tagline: event.tagline,
    description: event.description,
    startAt: event.startAt?.toISOString() ?? null,
    endAt: event.endAt?.toISOString() ?? null,
    datesConfirmed: event.datesConfirmed,
    timezone: event.timezone,
    timezoneConfirmed: event.timezoneConfirmed,
    format: event.format,
    formatConfirmed: event.formatConfirmed,
    heroImageUrl: event.heroImageUrl,
    venue,
    settings,
    speakers: event.speakers.map((speaker) => {
      const meta = speakerMeta.get(speaker.slug);
      return {
        id: speaker.id,
        slug: speaker.slug,
        name: speaker.name,
        jobTitle: speaker.jobTitle,
        organization: speaker.organization,
        biography: speaker.biography,
        portraitUrl: speaker.portraitUrl,
        portraitIsSample: speaker.portraitIsSample,
        expertise: readJson(speaker.expertise, stringArray, []),
        socialLinks: readJson(speaker.socialLinks, socialArray, []).filter((link) => isHttpUrl(link.url)),
        isSample: speaker.isSample,
        featured: speaker.featured,
        sessionTitles: meta?.titles ?? [],
        categories: meta?.categories ?? [],
      };
    }),
    sessions,
    tickets: event.ticketTypes.map((ticket) => ({
      id: ticket.id,
      slug: ticket.slug,
      name: ticket.name,
      description: ticket.description,
      priceCents: ticket.priceCents,
      currency: ticket.currency,
      benefits: readJson(ticket.benefits, stringArray, []),
      capacity: ticket.capacity,
      sold: ticket.sold,
      salesStart: ticket.salesStart?.toISOString() ?? null,
      salesEnd: ticket.salesEnd?.toISOString() ?? null,
      isSample: ticket.isSample,
      eligibilityNote: ticket.eligibilityNote,
    })),
    sponsors: sponsors.map((sponsor) => ({
      id: sponsor.id,
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      website: isHttpUrl(sponsor.website) ? sponsor.website : "",
      tier: sponsor.tier,
      isSample: sponsor.isSample,
    })),
  };
}

export function eventNeedsPlaceholderNotice(event: PublicEvent) {
  return (
    !event.datesConfirmed ||
    !event.venue.confirmed ||
    !event.formatConfirmed ||
    !event.timezoneConfirmed ||
    !event.settings.currencyConfirmed ||
    event.speakers.some((speaker) => speaker.isSample) ||
    event.sessions.some((session) => session.isSample) ||
    event.tickets.some((ticket) => ticket.isSample) ||
    event.sponsors.some((sponsor) => sponsor.isSample)
  );
}
