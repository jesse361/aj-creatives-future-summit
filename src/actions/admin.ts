"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { EVENT_SLUG, SESSION_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { toMinorUnits } from "@/lib/format";
import { findRoomOverlap, validateSessionWindow } from "@/lib/schedule";
import { slugify } from "@/lib/security";
import { isValidTimeZone, zonedTimeToUtc } from "@/lib/time";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function flag(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function back(target: string, message: string, ok = false): never {
  const params = new URLSearchParams();
  params.set(ok ? "saved" : "error", message);
  redirect(`${target}?${params.toString()}`);
}

async function refresh() {
  revalidatePath("/", "layout");
}

async function getEvent() {
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } });
  if (!event) back("/admin", "The event record is missing.");
  return event;
}

export async function saveEvent(formData: FormData) {
  await requireAdmin();
  const event = await getEvent();
  const timezone = text(formData, "timezone") || "UTC";
  if (!isValidTimeZone(timezone)) back("/admin/event", "Enter a valid IANA timezone, such as UTC.");
  const startRaw = text(formData, "startAt");
  const endRaw = text(formData, "endAt");
  const startAt = startRaw ? zonedTimeToUtc(startRaw, timezone) : null;
  const endAt = endRaw ? zonedTimeToUtc(endRaw, timezone) : null;
  if (startRaw && !startAt) back("/admin/event", "The start time could not be read.");
  if (endRaw && !endAt) back("/admin/event", "The end time could not be read.");
  const datesConfirmed = flag(formData, "datesConfirmed");
  if (datesConfirmed && (!startAt || !endAt || endAt <= startAt)) {
    back("/admin/event", "A confirmed date needs a start and an end, with the end after the start.");
  }
  if (startAt && endAt && endAt <= startAt) back("/admin/event", "The end time must be after the start time.");
  const venueConfirmed = flag(formData, "venueConfirmed");
  const venueName = text(formData, "venueName");
  const venueCity = text(formData, "venueCity");
  if (venueConfirmed && (!venueName || !venueCity)) {
    back("/admin/event", "Confirming a venue requires a venue name and city.");
  }

  const whyAttend = [0, 1, 2, 3, 4]
    .map((index) => ({ title: text(formData, `whyTitle${index}`), text: text(formData, `whyText${index}`) }))
    .filter((item) => item.title && item.text);
  const highlights = [0, 1, 2, 3]
    .map((index) => ({
      title: text(formData, `highlightTitle${index}`),
      text: text(formData, `highlightText${index}`),
      image: text(formData, `highlightImage${index}`),
    }))
    .filter((item) => item.title && item.text);

  await prisma.event.update({
    where: { id: event.id },
    data: {
      name: text(formData, "name") || event.name,
      tagline: text(formData, "tagline"),
      description: text(formData, "description"),
      status: text(formData, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      format: text(formData, "format") || "TBD",
      timezone,
      startAt,
      endAt,
      datesConfirmed,
      heroImage: text(formData, "heroImage") || null,
      venueName: venueName || null,
      venueAddress: text(formData, "venueAddress") || null,
      venueCity: venueCity || null,
      venueCountry: text(formData, "venueCountry") || null,
      venueConfirmed,
      directionsUrl: text(formData, "directionsUrl") || null,
      mapEmbedUrl: text(formData, "mapEmbedUrl") || null,
      travelSummary: text(formData, "travelSummary") || null,
      transitInfo: text(formData, "transitInfo") || null,
      parkingInfo: text(formData, "parkingInfo") || null,
      accessibilityInfo: text(formData, "accessibilityInfo") || null,
      accommodationInfo: text(formData, "accommodationInfo") || null,
      hoursLabel: text(formData, "hoursLabel") || null,
      whyAttend: JSON.stringify(whyAttend),
      highlights: JSON.stringify(highlights),
      ctaHeadline: text(formData, "ctaHeadline") || "BE PART OF WHAT COMES NEXT.",
      ctaText: text(formData, "ctaText") || "Join the conversations, connections, and ideas shaping tomorrow.",
    },
  });
  await refresh();
  back("/admin/event", "Event details saved.", true);
}

async function uniqueSpeakerSlug(eventId: string, name: string, currentId?: string) {
  const base = slugify(name);
  let slug = base;
  let count = 2;
  while (
    await prisma.speaker.findFirst({
      where: { eventId, slug, ...(currentId ? { NOT: { id: currentId } } : {}) },
    })
  ) {
    slug = `${base}-${count++}`;
  }
  return slug;
}

function imageExtension(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function storePortrait(formData: FormData) {
  const file = formData.get("portraitFile");
  if (!(file instanceof File) || file.size === 0) return text(formData, "portrait") || null;
  if (file.size > 2_000_000) back("/admin/speakers", "Portrait uploads must be 2 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) back("/admin/speakers", "Portrait uploads must be a real JPG, PNG, or WebP file.");
  const filename = `${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return `/uploads/${filename}`;
}

export async function saveSpeaker(formData: FormData) {
  await requireAdmin();
  const event = await getEvent();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (name.length < 2) back("/admin/speakers", "Enter the speaker name.");
  const portrait = await storePortrait(formData);
  const expertise = text(formData, "expertise")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const socialLinks = {
    linkedin: text(formData, "linkedin"),
    instagram: text(formData, "instagram"),
    x: text(formData, "x"),
    website: text(formData, "website"),
  };
  const data = {
    name,
    jobTitle: text(formData, "jobTitle"),
    organization: text(formData, "organization"),
    bio: text(formData, "bio"),
    portrait,
    expertise: JSON.stringify(expertise),
    socialLinks: JSON.stringify(socialLinks),
    sessionTitle: text(formData, "sessionTitle") || null,
    featured: flag(formData, "featured"),
    published: flag(formData, "published"),
    isSample: flag(formData, "isSample"),
    sortOrder: Number(text(formData, "sortOrder") || "0") || 0,
  };
  if (id) {
    await prisma.speaker.update({ where: { id }, data });
  } else {
    await prisma.speaker.create({
      data: { ...data, eventId: event.id, slug: await uniqueSpeakerSlug(event.id, name) },
    });
  }
  await refresh();
  back("/admin/speakers", "Speaker saved.", true);
}

export async function deleteSpeaker(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (id) await prisma.speaker.delete({ where: { id } });
  await refresh();
  back("/admin/speakers", "Speaker removed.", true);
}

export async function saveSession(formData: FormData) {
  await requireAdmin();
  const event = await getEvent();
  const id = text(formData, "id");
  const title = text(formData, "title");
  if (title.length < 2) back("/admin/schedule", "Enter a session title.");
  const startAt = zonedTimeToUtc(text(formData, "startAt"), event.timezone);
  const endAt = zonedTimeToUtc(text(formData, "endAt"), event.timezone);
  if (!startAt || !endAt) back("/admin/schedule", "Enter a valid start and end time.");
  const windowError = validateSessionWindow(startAt, endAt);
  if (windowError) back("/admin/schedule", windowError);
  if (event.datesConfirmed && event.startAt && event.endAt && (startAt < event.startAt || endAt > event.endAt)) {
    back("/admin/schedule", "Session times must fall within the confirmed event dates.");
  }
  const category = text(formData, "category");
  if (!SESSION_CATEGORIES.includes(category as (typeof SESSION_CATEGORIES)[number])) {
    back("/admin/schedule", "Choose a session category.");
  }
  const room = text(formData, "room");
  const existing = await prisma.session.findMany({ where: { eventId: event.id } });
  const overlap = findRoomOverlap({ id, room, startAt, endAt, title }, existing);
  if (overlap) back("/admin/schedule", `This session overlaps “${overlap.title}” in the same room.`);
  const speakerIds = formData.getAll("speakerId").map(String).filter(Boolean);
  const data = {
    title,
    description: text(formData, "description"),
    startAt,
    endAt,
    room: room || null,
    category,
    isBreak: flag(formData, "isBreak") || category === "Break",
    published: flag(formData, "published"),
    isSample: flag(formData, "isSample"),
    sortOrder: Number(text(formData, "sortOrder") || "0") || 0,
  };
  const session = id
    ? await prisma.session.update({ where: { id }, data })
    : await prisma.session.create({ data: { ...data, eventId: event.id } });
  await prisma.sessionSpeaker.deleteMany({ where: { sessionId: session.id } });
  if (speakerIds.length) {
    await prisma.sessionSpeaker.createMany({
      data: speakerIds.map((speakerId) => ({ sessionId: session.id, speakerId, role: "speaker" })),
    });
  }
  await refresh();
  back("/admin/schedule", "Session saved.", true);
}

export async function deleteSession(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (id) await prisma.session.delete({ where: { id } });
  await refresh();
  back("/admin/schedule", "Session removed.", true);
}

export async function saveTicket(formData: FormData) {
  await requireAdmin();
  const event = await getEvent();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const price = Number(text(formData, "price"));
  const capacity = Number(text(formData, "capacity"));
  const currency = text(formData, "currency").toUpperCase();
  if (name.length < 2) back("/admin/tickets", "Enter a ticket name.");
  if (!Number.isFinite(price) || price < 0) back("/admin/tickets", "Enter a price of zero or more.");
  if (!Number.isInteger(capacity) || capacity < 0) back("/admin/tickets", "Enter a whole-number capacity.");
  if (!/^[A-Z]{3}$/.test(currency)) back("/admin/tickets", "Enter a three-letter currency code.");
  const current = id ? await prisma.ticketType.findUnique({ where: { id } }) : null;
  if (current && capacity < current.sold) back("/admin/tickets", "Capacity cannot be lower than the number already reserved.");
  const benefits = text(formData, "benefits").split("\n").map((item) => item.trim()).filter(Boolean);
  const salesStart = text(formData, "salesStart");
  const salesEnd = text(formData, "salesEnd");
  const data = {
    name,
    description: text(formData, "description"),
    priceMinor: toMinorUnits(price),
    currency,
    benefits: JSON.stringify(benefits),
    capacity,
    salesStart: salesStart ? new Date(salesStart) : null,
    salesEnd: salesEnd ? new Date(salesEnd) : null,
    active: flag(formData, "active"),
    isSample: flag(formData, "isSample"),
    eligibilityNote: text(formData, "eligibilityNote") || null,
    sortOrder: Number(text(formData, "sortOrder") || "0") || 0,
  };
  if (id) await prisma.ticketType.update({ where: { id }, data });
  else {
    const base = slugify(name);
    let slug = base;
    let count = 2;
    while (await prisma.ticketType.findFirst({ where: { eventId: event.id, slug } })) slug = `${base}-${count++}`;
    await prisma.ticketType.create({ data: { ...data, eventId: event.id, slug } });
  }
  await refresh();
  back("/admin/tickets", "Ticket saved.", true);
}

export async function saveSponsor(formData: FormData) {
  await requireAdmin();
  const event = await getEvent();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (name.length < 2) back("/admin/sponsors", "Enter a sponsor name.");
  const data = {
    name,
    logo: text(formData, "logo") || null,
    website: text(formData, "website") || null,
    tier: text(formData, "tier") || "Partner",
    sortOrder: Number(text(formData, "sortOrder") || "0") || 0,
    active: flag(formData, "active"),
    isSample: flag(formData, "isSample"),
  };
  if (id) await prisma.sponsor.update({ where: { id }, data });
  else await prisma.sponsor.create({ data: { ...data, eventId: event.id } });
  await refresh();
  back("/admin/sponsors", "Sponsor saved.", true);
}

export async function deleteSponsor(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (id) await prisma.sponsor.delete({ where: { id } });
  await refresh();
  back("/admin/sponsors", "Sponsor removed.", true);
}

export async function updateInquiry(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!["NEW", "REVIEWED", "ARCHIVED"].includes(status)) back("/admin/inquiries", "Choose a valid status.");
  await prisma.contactInquiry.update({ where: { id }, data: { status } });
  await refresh();
  back("/admin/inquiries", "Inquiry updated.", true);
}

export async function cancelRegistration(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({ where: { id } });
    if (!registration || registration.status === "CANCELLED") return;
    await tx.registration.update({ where: { id }, data: { status: "CANCELLED" } });
    await tx.$executeRaw`
      UPDATE "TicketType"
      SET "sold" = CASE
        WHEN "sold" >= ${registration.quantity} THEN "sold" - ${registration.quantity}
        ELSE 0
      END
      WHERE "id" = ${registration.ticketTypeId}
    `;
  });
  await refresh();
  back("/admin/registrations", "Registration cancelled and the reserved quantity was released.", true);
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const currency = text(formData, "currency").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) back("/admin/settings", "Enter a three-letter currency code.");
  const maxTickets = Number(text(formData, "maxTicketsPerOrder"));
  if (!Number.isInteger(maxTickets) || maxTickets < 1 || maxTickets > 10) {
    back("/admin/settings", "The per-order limit must be between 1 and 10.");
  }
  const socialLinks = {
    linkedin: text(formData, "linkedin"),
    instagram: text(formData, "instagram"),
    x: text(formData, "x"),
    youtube: text(formData, "youtube"),
    website: text(formData, "website"),
  };
  await prisma.eventSettings.update({
    where: { id: "default" },
    data: {
      organizerName: text(formData, "organizerName") || "AJ Creatives",
      contactEmail: text(formData, "contactEmail") || null,
      contactPhone: text(formData, "contactPhone") || null,
      websiteUrl: text(formData, "websiteUrl") || null,
      socialLinks: JSON.stringify(socialLinks),
      currency,
      registrationOpen: flag(formData, "registrationOpen"),
      maxTicketsPerOrder: maxTickets,
      requirePhone: flag(formData, "requirePhone"),
      privacyNotice: text(formData, "privacyNotice"),
      termsText: text(formData, "termsText"),
    },
  });
  await refresh();
  back("/admin/settings", "Settings saved.", true);
}
