import { prisma } from "@/lib/db";
import { EVENT_SLUG, formatLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { parseJson, safeHttpUrl, safeImageSrc, safeMapEmbed } from "@/lib/security";
import { formatDayKey, formatDayLabel, formatEventRange, formatTime, isValidTimeZone, safeTimeZone } from "@/lib/time";

export type SocialLinks = {
  linkedin?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  website?: string;
};

export type WhyItem = { title: string; text: string };
export type HighlightItem = { title: string; text: string; image: string };

function social(value: string): SocialLinks {
  const parsed = parseJson<SocialLinks>(value, {});
  const clean: SocialLinks = {};
  for (const key of ["linkedin", "instagram", "x", "youtube", "website"] as const) {
    const url = safeHttpUrl(parsed[key]);
    if (url) clean[key] = url;
  }
  return clean;
}

export async function getSiteData() {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: EVENT_SLUG },
      include: {
        speakers: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        sessions: {
          orderBy: [{ startAt: "asc" }, { sortOrder: "asc" }],
          include: { speakers: { include: { speaker: true } } },
        },
        ticketTypes: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        sponsors: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      },
    });
    const settings = await prisma.eventSettings.findUnique({ where: { id: "default" } });
    if (!event || !settings) return null;
    const timezone = safeTimeZone(event.timezone);
    const publishedSpeakers = event.speakers.filter((speaker) => speaker.published);
    const publishedSessions = event.sessions.filter((session) => session.published);
    const activeTickets = event.ticketTypes.filter((ticket) => ticket.active);
    const activeSponsors = event.sponsors.filter((sponsor) => sponsor.active);

    return {
      event: {
        id: event.id,
        name: event.name,
        tagline: event.tagline,
        description: event.description,
        status: event.status,
        format: event.format,
        formatLabel: formatLabel(event.format),
        timezone,
        timezoneConfigured: isValidTimeZone(event.timezone),
        datesConfirmed: event.datesConfirmed,
        startAt: event.startAt?.toISOString() ?? null,
        endAt: event.endAt?.toISOString() ?? null,
        whenLabel: event.datesConfirmed
          ? formatEventRange(event.startAt, event.endAt, timezone) ?? "Date to be confirmed"
          : event.startAt
            ? `Demonstration date, not confirmed: ${formatEventRange(event.startAt, event.endAt, timezone)}`
            : "Date to be confirmed",
        heroImage: safeImageSrc(event.heroImage),
        venueConfirmed: event.venueConfirmed,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        venueCity: event.venueCity,
        venueCountry: event.venueCountry,
        directionsUrl: safeHttpUrl(event.directionsUrl),
        mapEmbedUrl: safeMapEmbed(event.mapEmbedUrl),
        travelSummary: event.travelSummary,
        transitInfo: event.transitInfo,
        parkingInfo: event.parkingInfo,
        accessibilityInfo: event.accessibilityInfo,
        accommodationInfo: event.accommodationInfo,
        hoursLabel: event.hoursLabel,
        whyAttend: parseJson<WhyItem[]>(event.whyAttend, []),
        highlights: parseJson<HighlightItem[]>(event.highlights, []).map((item) => ({
          ...item,
          image: safeImageSrc(item.image) ?? "/images/stage.jpg",
        })),
        ctaHeadline: event.ctaHeadline,
        ctaText: event.ctaText,
      },
      settings: {
        organizerName: settings.organizerName,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        websiteUrl: safeHttpUrl(settings.websiteUrl),
        socialLinks: social(settings.socialLinks),
        currency: settings.currency,
        registrationOpen: settings.registrationOpen,
        maxTicketsPerOrder: settings.maxTicketsPerOrder,
        requirePhone: settings.requirePhone,
        privacyNotice: settings.privacyNotice,
        termsText: settings.termsText,
      },
      speakers: publishedSpeakers.map((speaker) => ({
        slug: speaker.slug,
        name: speaker.name,
        jobTitle: speaker.jobTitle,
        organization: speaker.organization,
        bio: speaker.bio,
        portrait: safeImageSrc(speaker.portrait),
        expertise: parseJson<string[]>(speaker.expertise, []),
        socialLinks: social(speaker.socialLinks),
        sessionTitle: speaker.sessionTitle,
        isSample: speaker.isSample,
        featured: speaker.featured,
      })),
      sessions: publishedSessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        startAt: session.startAt.toISOString(),
        endAt: session.endAt.toISOString(),
        timeLabel: `${formatTime(session.startAt, timezone)}–${formatTime(session.endAt, timezone)}`,
        dayKey: formatDayKey(session.startAt, timezone),
        dayLabel: formatDayLabel(session.startAt, timezone),
        room: session.room?.trim() || "Room to be confirmed",
        category: session.category,
        isBreak: session.isBreak || session.category === "Break",
        isSample: session.isSample,
        speakers: session.speakers.map((link) => ({
          name: link.speaker.name,
          slug: link.speaker.slug,
          role: link.role,
        })),
      })),
      tickets: activeTickets.map((ticket) => ({
        id: ticket.id,
        slug: ticket.slug,
        name: ticket.name,
        description: ticket.description,
        priceMinor: ticket.priceMinor,
        priceLabel: formatMoney(ticket.priceMinor, ticket.currency),
        currency: ticket.currency,
        benefits: parseJson<string[]>(ticket.benefits, []),
        capacity: ticket.capacity,
        sold: ticket.sold,
        remaining: Math.max(ticket.capacity - ticket.sold, 0),
        salesStart: ticket.salesStart?.toISOString() ?? null,
        salesEnd: ticket.salesEnd?.toISOString() ?? null,
        isSample: ticket.isSample,
        eligibilityNote: ticket.eligibilityNote,
      })),
      sponsors: activeSponsors.map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        logo: safeImageSrc(sponsor.logo),
        website: safeHttpUrl(sponsor.website),
        tier: sponsor.tier,
        isSample: sponsor.isSample,
      })),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export type SiteData = NonNullable<Awaited<ReturnType<typeof getSiteData>>>;
