import { cacheLife, cacheTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/constants";
import type { PublicSession } from "@/lib/types";

const publishedEvent = { status: "PUBLISHED" as const };

export type EventFilters = {
  q?: string;
  category?: string;
  format?: string;
  city?: string;
  when?: string;
  sort?: string;
  page?: number;
};

export function toPublicSession(session: {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  room: string;
  category: string;
  speakers: { role: string; speaker: { name: string; slug: string; status: string } }[];
}): PublicSession {
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    startAt: session.startTime.toISOString(),
    endAt: session.endTime.toISOString(),
    room: session.room,
    category: session.category,
    isBreak: session.category === "Break",
    isSample: false,
    speakers: session.speakers
      .filter((link) => link.speaker.status === "PUBLISHED")
      .map((link) => ({ name: link.speaker.name, slug: link.speaker.slug, role: link.role })),
  };
}

export async function getUpcomingPublished(limit = 6) {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  try {
    return await prisma.event.findMany({
      where: { ...publishedEvent, endDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: limit,
      include: { ticketTypes: { where: { status: "ACTIVE" }, orderBy: { priceMinor: "asc" }, take: 1 } },
    });
  } catch (error) {
    console.error("Events are unavailable.", error);
    return [];
  }
}

export async function getFeaturedEvent() {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  try {
    return await prisma.event.findFirst({
      where: { ...publishedEvent, isDemonstration: false, endDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      include: { ticketTypes: { where: { status: "ACTIVE" }, orderBy: { priceMinor: "asc" }, take: 1 } },
    });
  } catch (error) {
    console.error("Featured event is unavailable.", error);
    return null;
  }
}

export async function getEventBySlug(slug: string) {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  try {
    const event = await prisma.event.findFirst({
      where: { slug, ...publishedEvent },
      include: {
        ticketTypes: { where: { status: "ACTIVE" }, orderBy: { priceMinor: "asc" } },
        sessions: {
          where: { status: "PUBLISHED" },
          orderBy: [{ startTime: "asc" }, { displayOrder: "asc" }],
          include: { speakers: { include: { speaker: true } } },
        },
        speakers: { include: { speaker: true } },
        sponsors: { include: { sponsor: true } },
      },
    });
    return event;
  } catch (error) {
    console.error("Event is unavailable.", error);
    return null;
  }
}

export async function listEvents(filters: EventFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const take = 9;
  const now = new Date();
  const where: Prisma.EventWhereInput = { ...publishedEvent };
  if (filters.when === "past") where.endDate = { lt: now };
  else where.endDate = { gte: now };
  if (filters.category) where.category = filters.category;
  if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };
  if (filters.format === "ONLINE" || filters.format === "IN_PERSON" || filters.format === "HYBRID") where.eventFormat = filters.format;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { shortDescription: { contains: filters.q, mode: "insensitive" } },
      { fullDescription: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.EventOrderByWithRelationInput =
    filters.sort === "title" ? { title: "asc" } : filters.sort === "latest" ? { startDate: "desc" } : { startDate: "asc" };
  try {
    const [total, events, categories, cities] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * take,
        take,
        include: { ticketTypes: { where: { status: "ACTIVE" }, orderBy: { priceMinor: "asc" }, take: 1 } },
      }),
      prisma.event.findMany({ where: publishedEvent, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
      prisma.event.findMany({
        where: { ...publishedEvent, city: { not: "" } },
        distinct: ["city"],
        select: { city: true },
        orderBy: { city: "asc" },
      }),
    ]);
    return { events, total, page, pages: Math.max(1, Math.ceil(total / take)), categories: categories.map((item) => item.category), cities: cities.map((item) => item.city) };
  } catch (error) {
    console.error("Event directory is unavailable.", error);
    return { events: [], total: 0, page: 1, pages: 1, categories: [] as string[], cities: [] as string[] };
  }
}

export async function getPublishedSpeakers() {
  "use cache";
  cacheTag(TAGS.speakers);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.speaker.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: { events: { include: { event: true } }, sessions: { include: { session: true } } },
    });
  } catch (error) {
    console.error("Speakers are unavailable.", error);
    return [];
  }
}

export async function getSpeakerBySlug(slug: string) {
  "use cache";
  cacheTag(TAGS.speakers);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.speaker.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        events: { include: { event: true } },
        sessions: { include: { session: { include: { event: true } } } },
      },
    });
  } catch (error) {
    console.error("Speaker is unavailable.", error);
    return null;
  }
}

export async function getApprovedSponsors() {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.sponsor.findMany({ where: { status: "APPROVED" }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] });
  } catch {
    return [];
  }
}

export async function getApprovedTestimonials() {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.testimonial.findMany({ where: { status: "APPROVED" }, orderBy: { displayOrder: "asc" } });
  } catch {
    return [];
  }
}

export async function getPublishedFaqs() {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.faq.findMany({ where: { published: true }, orderBy: [{ displayOrder: "asc" }, { question: "asc" }] });
  } catch {
    return [];
  }
}

export async function getTicketCatalogue() {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  try {
    return await prisma.event.findMany({
      where: { ...publishedEvent, endDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 12,
      include: { ticketTypes: { where: { status: "ACTIVE" }, orderBy: { priceMinor: "asc" } } },
    });
  } catch (error) {
    console.error("Ticket catalogue is unavailable.", error);
    return [];
  }
}

export async function getPreviewSessions(eventId: string) {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  try {
    const sessions = await prisma.session.findMany({
      where: { eventId, status: "PUBLISHED" },
      orderBy: { startTime: "asc" },
      take: 4,
      include: { speakers: { include: { speaker: true } } },
    });
    return sessions.map(toPublicSession);
  } catch {
    return [];
  }
}

export async function relatedEvents(eventId: string, category: string) {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.event.findMany({
      where: { ...publishedEvent, id: { not: eventId }, category },
      orderBy: { startDate: "asc" },
      take: 3,
    });
  } catch {
    return [];
  }
}
