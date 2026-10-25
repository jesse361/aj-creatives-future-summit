"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getAdminEvent } from "@/lib/admin-data";
import { PUBLIC_EVENT_TAG, SESSION_CATEGORIES } from "@/lib/constants";
import { parsePriceToCents } from "@/lib/money";
import { isHttpUrl, isSafeImageSrc, isSafeEmbedUrl, slugify } from "@/lib/safe-url";
import { isValidTimeZone, zonedInputToUtc } from "@/lib/time";
import { sessionsOverlap } from "@/lib/schedule";
import { cancelRegistrationRecord } from "@/lib/registration";
import { saveImageUpload } from "@/lib/uploads";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function checked(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "true";
}

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function done(path: string): never {
  updateTag(PUBLIC_EVENT_TAG);
  redirect(`${path}${path.includes("?") ? "&" : "?"}saved=1`);
}

async function eventOrFail() {
  await requireAdmin();
  const event = await getAdminEvent();
  if (!event || !event.settings || !event.venue) fail("/admin", "Set up the event database before editing.");
  return event;
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export async function saveEvent(formData: FormData) {
  const event = await eventOrFail();
  const name = text(formData, "name");
  const tagline = text(formData, "tagline");
  const description = text(formData, "description");
  const status = text(formData, "status");
  const timezone = text(formData, "timezone") || "UTC";
  const format = text(formData, "format");
  const heroImageUrl = text(formData, "heroImageUrl");
  const heroEyebrow = text(formData, "heroEyebrow");
  const heroDescription = text(formData, "heroDescription");
  if (name.length < 3 || tagline.length < 3 || description.length < 10) fail("/admin/event", "Add a name, tagline, and description.");
  if (status !== "DRAFT" && status !== "PUBLISHED") fail("/admin/event", "Choose draft or published.");
  if (!isValidTimeZone(timezone)) fail("/admin/event", "Enter a valid IANA timezone, such as UTC or Africa/Accra.");
  if (heroImageUrl && !isSafeImageSrc(heroImageUrl)) fail("/admin/event", "Use a site image path or an https image URL.");
  if (checked(formData, "formatConfirmed") && !["IN_PERSON", "VIRTUAL", "HYBRID"].includes(format)) {
    fail("/admin/event", "Choose a format before marking it confirmed.");
  }

  const startRaw = text(formData, "startAt");
  const endRaw = text(formData, "endAt");
  const startAt = startRaw ? zonedInputToUtc(startRaw, timezone) : null;
  const endAt = endRaw ? zonedInputToUtc(endRaw, timezone) : null;
  if ((startRaw && !startAt) || (endRaw && !endAt)) fail("/admin/event", "Enter dates as YYYY-MM-DDTHH:MM.");
  if (startAt && endAt && endAt <= startAt) fail("/admin/event", "The end must be after the start.");
  if (checked(formData, "datesConfirmed") && (!startAt || !endAt)) {
    fail("/admin/event", "Add a start and end before marking the date confirmed.");
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      name,
      tagline,
      description,
      status,
      timezone,
      timezoneConfirmed: checked(formData, "timezoneConfirmed"),
      format: format || null,
      formatConfirmed: checked(formData, "formatConfirmed"),
      heroImageUrl,
      startAt,
      endAt,
      datesConfirmed: checked(formData, "datesConfirmed"),
    },
  });
  await prisma.eventSettings.update({
    where: { eventId: event.id },
    data: { heroEyebrow, heroDescription },
  });
  done("/admin/event");
}

export async function saveVenue(formData: FormData) {
  const event = await eventOrFail();
  const directionsUrl = text(formData, "directionsUrl");
  const mapEmbedUrl = text(formData, "mapEmbedUrl");
  const confirmed = checked(formData, "confirmed");
  if (directionsUrl && !isHttpUrl(directionsUrl)) fail("/admin/venue", "Directions need an http or https link.");
  if (mapEmbedUrl && !isSafeEmbedUrl(mapEmbedUrl)) {
    fail("/admin/venue", "Map embeds must be https links from Google Maps or OpenStreetMap.");
  }
  if (confirmed && !text(formData, "name")) fail("/admin/venue", "Add a venue name before marking it confirmed.");

  await prisma.venue.update({
    where: { eventId: event.id },
    data: {
      confirmed,
      name: text(formData, "name"),
      streetAddress: text(formData, "streetAddress"),
      city: text(formData, "city"),
      country: text(formData, "country"),
      publicTransport: text(formData, "publicTransport"),
      parking: text(formData, "parking"),
      accessibility: text(formData, "accessibility"),
      accommodation: text(formData, "accommodation"),
      directionsUrl,
      mapEmbedUrl,
      travelSummary: text(formData, "travelSummary"),
      hoursLabel: text(formData, "hoursLabel"),
    },
  });
  done("/admin/venue");
}

export async function saveSettings(formData: FormData) {
  const event = await eventOrFail();
  const currency = text(formData, "currency").toUpperCase();
  const contactEmail = text(formData, "contactEmail");
  const nextEventUrl = text(formData, "nextEventUrl");
  if (!/^[A-Z]{3}$/.test(currency)) fail("/admin/settings", "Use a three-letter currency code.");
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) fail("/admin/settings", "Enter a valid contact email or leave it blank.");
  if (nextEventUrl && !isHttpUrl(nextEventUrl)) fail("/admin/settings", "The next-event link must start with http or https.");

  const whyAttend = [0, 1, 2, 3, 4, 5].flatMap((index) => {
    const title = text(formData, `whyTitle${index}`);
    const description = text(formData, `whyDescription${index}`);
    return title && description ? [{ title, description }] : [];
  });
  const highlights = [0, 1, 2, 3].flatMap((index) => {
    const title = text(formData, `highlightTitle${index}`);
    const description = text(formData, `highlightDescription${index}`);
    const image = text(formData, `highlightImage${index}`);
    if (!title || !description) return [];
    if (image && !isSafeImageSrc(image)) fail("/admin/settings", "Highlight images must be local paths or https URLs.");
    return [{ title, description, image }];
  });
  const socialLinks = [0, 1, 2, 3, 4, 5].flatMap((index) => {
    const label = text(formData, `socialLabel${index}`);
    const url = text(formData, `socialUrl${index}`);
    if (!label && !url) return [];
    if (!label || !isHttpUrl(url)) fail("/admin/settings", "Each social link needs a label and an http or https URL.");
    return [{ label, url }];
  });

  await prisma.eventSettings.update({
    where: { eventId: event.id },
    data: {
      organizerName: text(formData, "organizerName") || "AJ CREATIVES",
      contactEmail,
      contactPhone: text(formData, "contactPhone"),
      socialLinks: JSON.stringify(socialLinks),
      currency,
      currencyConfirmed: checked(formData, "currencyConfirmed"),
      registrationOpen: checked(formData, "registrationOpen"),
      phoneRequired: checked(formData, "phoneRequired"),
      privacyNotice: text(formData, "privacyNotice"),
      termsText: text(formData, "termsText"),
      whyAttend: JSON.stringify(whyAttend),
      highlights: JSON.stringify(highlights),
      ctaHeadline: text(formData, "ctaHeadline"),
      ctaDescription: text(formData, "ctaDescription"),
      nextEventUrl,
      nextEventLabel: text(formData, "nextEventLabel"),
    },
  });
  done("/admin/settings");
}

async function uniqueSlug(eventId: string, desired: string, currentId: string, model: "speaker" | "ticketType") {
  const slug = slugify(desired);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
    const existing =
      model === "speaker"
        ? await prisma.speaker.findFirst({ where: { eventId, slug: candidate, NOT: currentId ? { id: currentId } : undefined } })
        : await prisma.ticketType.findFirst({ where: { eventId, slug: candidate, NOT: currentId ? { id: currentId } : undefined } });
    if (!existing) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

function socialFromText(value: string) {
  return lines(value).map((line) => {
    const [label, url] = line.split("|").map((part) => part.trim());
    if (!label || !url || !isHttpUrl(url)) {
      throw new Error("Write social links as Label | https://example.com, one per line.");
    }
    return { label, url };
  });
}

export async function saveSpeaker(formData: FormData) {
  const event = await eventOrFail();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const jobTitle = text(formData, "jobTitle");
  const organization = text(formData, "organization");
  const biography = text(formData, "biography");
  if (name.length < 2 || jobTitle.length < 2 || organization.length < 2 || biography.length < 20) {
    fail(`/admin/speakers?edit=${id || "new"}`, "Add a name, title, organization, and a biography of at least 20 characters.");
  }
  let socialLinks = "[]";
  try {
    socialLinks = JSON.stringify(socialFromText(text(formData, "social")));
  } catch (error) {
    fail(`/admin/speakers?edit=${id || "new"}`, error instanceof Error ? error.message : "Check the social links.");
  }
  const expertise = lines(text(formData, "expertise").replaceAll(",", "\n"));
  let portraitUrl = text(formData, "portraitUrl");
  try {
    const upload = formData.get("portrait");
    if (upload instanceof File && upload.size > 0) portraitUrl = await saveImageUpload(upload);
  } catch (error) {
    fail(`/admin/speakers?edit=${id || "new"}`, error instanceof Error ? error.message : "The portrait could not be saved.");
  }
  if (portraitUrl && !isSafeImageSrc(portraitUrl)) fail(`/admin/speakers?edit=${id || "new"}`, "Use a safe portrait path or https URL.");
  const slug = await uniqueSlug(event.id, text(formData, "slug") || name, id, "speaker");
  const data = {
    name,
    slug,
    jobTitle,
    organization,
    biography,
    portraitUrl,
    portraitIsSample: checked(formData, "portraitIsSample"),
    expertise: JSON.stringify(expertise),
    socialLinks,
    isSample: checked(formData, "isSample"),
    published: checked(formData, "published"),
    featured: checked(formData, "featured"),
    displayOrder: Number(text(formData, "displayOrder") || "0") || 0,
  };
  if (id) {
    const existing = await prisma.speaker.findFirst({ where: { id, eventId: event.id } });
    if (!existing) fail("/admin/speakers", "That speaker was not found.");
    await prisma.speaker.update({ where: { id }, data });
  } else {
    await prisma.speaker.create({ data: { ...data, eventId: event.id } });
  }
  done("/admin/speakers");
}

export async function deleteSpeaker(formData: FormData) {
  const event = await eventOrFail();
  const id = text(formData, "id");
  await prisma.speaker.deleteMany({ where: { id, eventId: event.id } });
  done("/admin/speakers");
}

export async function saveSession(formData: FormData) {
  const event = await eventOrFail();
  const id = text(formData, "id");
  const title = text(formData, "title");
  const description = text(formData, "description");
  const category = text(formData, "category");
  const room = text(formData, "room");
  if (title.length < 3) fail(`/admin/schedule?edit=${id || "new"}`, "Add a session title.");
  if (!SESSION_CATEGORIES.includes(category as (typeof SESSION_CATEGORIES)[number])) {
    fail(`/admin/schedule?edit=${id || "new"}`, "Choose a session category.");
  }
  const startAt = zonedInputToUtc(text(formData, "startAt"), event.timezone);
  const endAt = zonedInputToUtc(text(formData, "endAt"), event.timezone);
  if (!startAt || !endAt || endAt <= startAt) fail(`/admin/schedule?edit=${id || "new"}`, "Enter a valid start and a later end time.");
  const others = await prisma.session.findMany({ where: { eventId: event.id } });
  const clash = sessionsOverlap({ startAt, endAt, room }, others, id || undefined);
  if (clash) fail(`/admin/schedule?edit=${id || "new"}`, "That room already has a session during this time.");

  const speakerIds = [...new Set([...formData.getAll("speakerId").map(String), text(formData, "moderatorId")].filter(Boolean))];
  const knownSpeakers = await prisma.speaker.findMany({ where: { eventId: event.id, id: { in: speakerIds } } });
  const allowed = new Set(knownSpeakers.map((speaker) => speaker.id));
  const moderatorId = allowed.has(text(formData, "moderatorId")) ? text(formData, "moderatorId") : "";
  const data = {
    title,
    description,
    startAt,
    endAt,
    room,
    category,
    isBreak: checked(formData, "isBreak"),
    published: checked(formData, "published"),
    isSample: checked(formData, "isSample"),
    displayOrder: Number(text(formData, "displayOrder") || "0") || 0,
  };

  let sessionId = id;
  if (id) {
    const owned = await prisma.session.findFirst({ where: { id, eventId: event.id } });
    if (!owned) fail("/admin/schedule", "That session was not found.");
    await prisma.session.update({ where: { id }, data });
  } else {
    const created = await prisma.session.create({ data: { ...data, eventId: event.id } });
    sessionId = created.id;
  }
  await prisma.sessionSpeaker.deleteMany({ where: { sessionId } });
  await prisma.sessionSpeaker.createMany({
    data: [...allowed].map((speakerId) => ({
      sessionId,
      speakerId,
      role: speakerId === moderatorId ? "MODERATOR" : "SPEAKER",
    })),
  });
  done("/admin/schedule");
}

export async function deleteSession(formData: FormData) {
  const event = await eventOrFail();
  await prisma.session.deleteMany({ where: { id: text(formData, "id"), eventId: event.id } });
  done("/admin/schedule");
}

export async function saveTicket(formData: FormData) {
  const event = await eventOrFail();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const priceCents = parsePriceToCents(text(formData, "price"));
  const currency = text(formData, "currency").toUpperCase();
  const capacity = Number(text(formData, "capacity"));
  if (name.length < 2 || priceCents === null || !/^[A-Z]{3}$/.test(currency) || !Number.isInteger(capacity) || capacity < 0) {
    fail(`/admin/tickets?edit=${id || "new"}`, "Add a name, a price such as 150.00 or 0, a currency, and a capacity.");
  }
  const existing = id ? await prisma.ticketType.findFirst({ where: { id, eventId: event.id } }) : null;
  if (id && !existing) fail("/admin/tickets", "That ticket was not found.");
  if (existing && capacity < existing.sold) fail(`/admin/tickets?edit=${id}`, "Capacity cannot be lower than the number already reserved.");
  const salesStart = text(formData, "salesStart") ? zonedInputToUtc(text(formData, "salesStart"), event.timezone) : null;
  const salesEnd = text(formData, "salesEnd") ? zonedInputToUtc(text(formData, "salesEnd"), event.timezone) : null;
  if ((text(formData, "salesStart") && !salesStart) || (text(formData, "salesEnd") && !salesEnd)) {
    fail(`/admin/tickets?edit=${id || "new"}`, "Check the sales window dates.");
  }
  if (salesStart && salesEnd && salesEnd <= salesStart) fail(`/admin/tickets?edit=${id || "new"}`, "Sales must end after they start.");
  const slug = await uniqueSlug(event.id, text(formData, "slug") || name, id, "ticketType");
  const data = {
    name,
    slug,
    description: text(formData, "description"),
    priceCents,
    currency,
    benefits: JSON.stringify(lines(text(formData, "benefits"))),
    capacity,
    salesStart,
    salesEnd,
    active: checked(formData, "active"),
    isSample: checked(formData, "isSample"),
    eligibilityNote: text(formData, "eligibilityNote"),
    displayOrder: Number(text(formData, "displayOrder") || "0") || 0,
  };
  if (existing) await prisma.ticketType.update({ where: { id: existing.id }, data });
  else await prisma.ticketType.create({ data: { ...data, eventId: event.id, sold: 0 } });
  done("/admin/tickets");
}

export async function deleteTicket(formData: FormData) {
  const event = await eventOrFail();
  const id = text(formData, "id");
  const used = await prisma.registration.count({ where: { ticketTypeId: id } });
  if (used > 0) fail("/admin/tickets", "Cancel registrations for this ticket before deleting it.");
  await prisma.ticketType.deleteMany({ where: { id, eventId: event.id } });
  done("/admin/tickets");
}

export async function saveSponsor(formData: FormData) {
  const event = await eventOrFail();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const website = text(formData, "website");
  if (name.length < 2) fail(`/admin/sponsors?edit=${id || "new"}`, "Add the sponsor name.");
  if (website && !isHttpUrl(website)) fail(`/admin/sponsors?edit=${id || "new"}`, "The website must be an http or https link.");
  let logoUrl = text(formData, "logoUrl");
  try {
    const upload = formData.get("logo");
    if (upload instanceof File && upload.size > 0) logoUrl = await saveImageUpload(upload);
  } catch (error) {
    fail(`/admin/sponsors?edit=${id || "new"}`, error instanceof Error ? error.message : "The logo could not be saved.");
  }
  if (logoUrl && !isSafeImageSrc(logoUrl)) fail(`/admin/sponsors?edit=${id || "new"}`, "Use a safe logo path or https URL.");
  const data = {
    name,
    logoUrl,
    website,
    tier: text(formData, "tier") || "Partner",
    displayOrder: Number(text(formData, "displayOrder") || "0") || 0,
    active: checked(formData, "active"),
    isSample: checked(formData, "isSample"),
  };
  if (id) {
    const existing = await prisma.sponsor.findFirst({ where: { id, eventId: event.id } });
    if (!existing) fail("/admin/sponsors", "That sponsor was not found.");
    await prisma.sponsor.update({ where: { id }, data });
  } else {
    await prisma.sponsor.create({ data: { ...data, eventId: event.id } });
  }
  done("/admin/sponsors");
}

export async function deleteSponsor(formData: FormData) {
  const event = await eventOrFail();
  await prisma.sponsor.deleteMany({ where: { id: text(formData, "id"), eventId: event.id } });
  done("/admin/sponsors");
}

export async function updateInquiry(formData: FormData) {
  const event = await eventOrFail();
  const status = text(formData, "status");
  if (!["NEW", "REVIEWED", "ARCHIVED"].includes(status)) fail("/admin/inquiries", "Choose a valid status.");
  await prisma.contactInquiry.updateMany({ where: { id: text(formData, "id"), eventId: event.id }, data: { status } });
  done("/admin/inquiries");
}

export async function cancelRegistration(formData: FormData) {
  const event = await eventOrFail();
  const registration = await prisma.registration.findFirst({ where: { id: text(formData, "id"), eventId: event.id } });
  if (!registration) fail("/admin/registrations", "That registration was not found.");
  await cancelRegistrationRecord(registration.id);
  done("/admin/registrations");
}
