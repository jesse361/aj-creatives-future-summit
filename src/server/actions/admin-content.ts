"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/constants";
import { writeAudit } from "@/lib/audit";
import { isSafeImageSrc } from "@/lib/safe-url";
import { isValidTimeZone, zonedInputToUtc } from "@/lib/time";
import { sessionsOverlap } from "@/lib/schedule";
import { checkbox, eventSchema, faqPairSchema, fieldErrors, lines, sessionSchema, speakerSchema, ticketSchema } from "@/lib/validation";
import { parsePriceToCents } from "@/lib/money";
import { guard } from "@/server/actions/guard";
import type { FormState } from "@/lib/types";

function refreshContent() {
  updateTag(TAGS.events);
  updateTag(TAGS.speakers);
  updateTag(TAGS.pages);
}

async function readFaqs(formData: FormData) {
  const questions = formData.getAll("faqQuestion").map(String);
  const answers = formData.getAll("faqAnswer").map(String);
  const faqs = [];
  for (let index = 0; index < questions.length; index += 1) {
    const parsed = faqPairSchema.safeParse({ question: questions[index], answer: answers[index] ?? "" });
    if ((questions[index] ?? "").trim() || (answers[index] ?? "").trim()) {
      if (!parsed.success) return { error: "Check the event questions and answers." as const, faqs: [] };
      faqs.push(parsed.data);
    }
  }
  return { error: null, faqs };
}

export async function saveEvent(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    fullDescription: formData.get("fullDescription"),
    category: formData.get("category"),
    coverImage: formData.get("coverImage") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    timezone: formData.get("timezone"),
    venueName: formData.get("venueName") ?? "",
    venueAddress: formData.get("venueAddress") ?? "",
    city: formData.get("city") ?? "",
    country: formData.get("country") ?? "",
    eventFormat: formData.get("eventFormat"),
    onlineDetails: formData.get("onlineDetails") ?? "",
    travelInfo: formData.get("travelInfo") ?? "",
    accessibilityInfo: formData.get("accessibilityInfo") ?? "",
    status: formData.get("status"),
    registrationOpen: checkbox(formData.get("registrationOpen")),
    isDemonstration: checkbox(formData.get("isDemonstration")),
  });
  if (!parsed.success) return { ok: false, message: "Check the highlighted event fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isValidTimeZone(parsed.data.timezone)) return { ok: false, message: "Enter a valid IANA timezone, such as Africa/Accra." };
  if (parsed.data.coverImage && !isSafeImageSrc(parsed.data.coverImage)) return { ok: false, message: "Use a site path or https image for the cover." };
  const gallery = lines(formData.get("gallery"));
  if (gallery.some((item) => !isSafeImageSrc(item))) return { ok: false, message: "Gallery images must be site paths or https URLs." };
  const faqs = await readFaqs(formData);
  if (faqs.error) return { ok: false, message: faqs.error };
  const start = zonedInputToUtc(parsed.data.startDate, parsed.data.timezone);
  const end = zonedInputToUtc(parsed.data.endDate, parsed.data.timezone);
  if (!start || !end || end <= start) return { ok: false, message: "Enter a valid start and end in the event timezone." };
  const id = String(formData.get("id") ?? "");
  const data = {
    ...parsed.data,
    coverImage: parsed.data.coverImage,
    gallery,
    faqs: faqs.faqs,
    startDate: start,
    endDate: end,
    publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
  };
  try {
    const saved = id
      ? await prisma.event.update({ where: { id }, data: { ...data, publishedAt: parsed.data.status === "PUBLISHED" ? undefined : null } })
      : await prisma.event.create({ data });
    if (id && parsed.data.status === "PUBLISHED") {
      const current = await prisma.event.findUnique({ where: { id } });
      if (current && !current.publishedAt) await prisma.event.update({ where: { id }, data: { publishedAt: new Date() } });
    }
    const speakerIds = formData.getAll("speakerId").map(String).filter(Boolean);
    await prisma.eventSpeaker.deleteMany({ where: { eventId: saved.id } });
    if (speakerIds.length) {
      await prisma.eventSpeaker.createMany({ data: speakerIds.map((speakerId) => ({ eventId: saved.id, speakerId })), skipDuplicates: true });
    }
    const sponsorIds = formData.getAll("sponsorId").map(String).filter(Boolean);
    await prisma.eventSponsor.deleteMany({ where: { eventId: saved.id } });
    if (sponsorIds.length) {
      await prisma.eventSponsor.createMany({ data: sponsorIds.map((sponsorId) => ({ eventId: saved.id, sponsorId })), skipDuplicates: true });
    }
    await writeAudit(admin, id ? "event.update" : "event.create", "Event", saved.id, saved.title);
    refreshContent();
    if (!id) redirect(`/admin/events/${saved.id}/edit`);
    return { ok: true, message: "Event saved." };
  } catch (error) {
    unstable_rethrow(error);
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2002") return { ok: false, message: "That slug is already in use." };
    if (code === "P2003") return { ok: false, message: "One of the selected speakers or sponsors no longer exists." };
    return { ok: false, message: "The event could not be saved." };
  }
}

export async function saveSpeaker(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const socials = formData
    .getAll("socialLabel")
    .map((label, index) => ({ label: String(label), url: String(formData.getAll("socialUrl")[index] ?? "") }))
    .filter((item) => item.label.trim() || item.url.trim());
  const parsed = speakerSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    professionalTitle: formData.get("professionalTitle"),
    organization: formData.get("organization") ?? "",
    biography: formData.get("biography"),
    portrait: formData.get("portrait") ?? "",
    portraitAlt: formData.get("portraitAlt") ?? "",
    expertise: lines(formData.get("expertise")),
    socialLinks: socials,
    status: formData.get("status"),
    featured: checkbox(formData.get("featured")),
    isDemonstration: checkbox(formData.get("isDemonstration")),
  });
  if (!parsed.success) return { ok: false, message: "Check the speaker profile.", fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.portrait && !isSafeImageSrc(parsed.data.portrait)) return { ok: false, message: "Use a site path or https image for the portrait." };
  const id = String(formData.get("id") ?? "");
  try {
    const saved = id
      ? await prisma.speaker.update({ where: { id }, data: parsed.data })
      : await prisma.speaker.create({ data: parsed.data });
    await writeAudit(admin, id ? "speaker.update" : "speaker.create", "Speaker", saved.id, saved.name);
    refreshContent();
    return { ok: true, message: "Speaker saved." };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2002") return { ok: false, message: "That speaker slug is already in use." };
    return { ok: false, message: "The speaker could not be saved." };
  }
}

export async function deleteSpeaker(formData: FormData) {
  const { admin, error } = await guard("content");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  await prisma.speaker.delete({ where: { id } }).catch(() => null);
  await writeAudit(admin, "speaker.delete", "Speaker", id, "Speaker removed");
  refreshContent();
}

export async function saveSession(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = sessionSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    room: formData.get("room") ?? "",
    category: formData.get("category"),
    displayOrder: formData.get("displayOrder") ?? 0,
    status: formData.get("status"),
    speakerIds: formData.getAll("sessionSpeakerId").map(String).filter(Boolean),
  });
  if (!parsed.success) return { ok: false, message: "Check the session.", fieldErrors: fieldErrors(parsed.error) };
  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) return { ok: false, message: "Choose an event first." };
  const start = zonedInputToUtc(parsed.data.startTime, event.timezone);
  const end = zonedInputToUtc(parsed.data.endTime, event.timezone);
  if (!start || !end || end <= start) return { ok: false, message: "Enter a valid session time in the event timezone." };
  const id = String(formData.get("id") ?? "");
  const others = await prisma.session.findMany({ where: { eventId: event.id } });
  const overlap = sessionsOverlap(
    { startAt: start, endAt: end, room: parsed.data.room },
    others.map((session) => ({ id: session.id, startAt: session.startTime, endAt: session.endTime, room: session.room })),
    id || undefined,
  );
  if (overlap && parsed.data.room.trim()) return { ok: false, message: "Another session already uses that room at this time." };
  const saved = id
    ? await prisma.session.update({
        where: { id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          startTime: start,
          endTime: end,
          room: parsed.data.room,
          category: parsed.data.category,
          displayOrder: parsed.data.displayOrder,
          status: parsed.data.status,
        },
      })
    : await prisma.session.create({
        data: {
          eventId: event.id,
          title: parsed.data.title,
          description: parsed.data.description,
          startTime: start,
          endTime: end,
          room: parsed.data.room,
          category: parsed.data.category,
          displayOrder: parsed.data.displayOrder,
          status: parsed.data.status,
        },
      });
  await prisma.sessionSpeaker.deleteMany({ where: { sessionId: saved.id } });
  if (parsed.data.speakerIds.length) {
    await prisma.sessionSpeaker.createMany({
      data: parsed.data.speakerIds.map((speakerId) => ({ sessionId: saved.id, speakerId })),
      skipDuplicates: true,
    });
  }
  await writeAudit(admin, id ? "session.update" : "session.create", "Session", saved.id, saved.title);
  refreshContent();
  return { ok: true, message: "Session saved." };
}

export async function deleteSession(formData: FormData) {
  const { admin, error } = await guard("content");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  await prisma.session.delete({ where: { id } }).catch(() => null);
  await writeAudit(admin, "session.delete", "Session", id, "Session removed");
  refreshContent();
}

export async function saveTicket(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("commerce");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = ticketSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    currency: String(formData.get("currency") ?? "").toUpperCase(),
    capacity: formData.get("capacity"),
    salesStart: String(formData.get("salesStart") ?? ""),
    salesEnd: String(formData.get("salesEnd") ?? ""),
    minimumQuantity: formData.get("minimumQuantity") ?? 1,
    maximumQuantity: formData.get("maximumQuantity") ?? 8,
    benefits: lines(formData.get("benefits")),
    status: formData.get("status"),
    isDemonstration: checkbox(formData.get("isDemonstration")),
  });
  if (!parsed.success) return { ok: false, message: "Check the ticket.", fieldErrors: fieldErrors(parsed.error) };
  const priceMinor = parsePriceToCents(parsed.data.price);
  if (priceMinor == null) return { ok: false, message: "Enter a price with up to two decimal places." };
  const event = await prisma.event.findUnique({ where: { id: parsed.data.eventId } });
  if (!event) return { ok: false, message: "Choose an event first." };
  const salesStart = parsed.data.salesStart ? zonedInputToUtc(parsed.data.salesStart, event.timezone) : null;
  const salesEnd = parsed.data.salesEnd ? zonedInputToUtc(parsed.data.salesEnd, event.timezone) : null;
  if (parsed.data.salesStart && !salesStart) return { ok: false, message: "Sales start is not a valid date." };
  if (parsed.data.salesEnd && !salesEnd) return { ok: false, message: "Sales end is not a valid date." };
  if (salesStart && salesEnd && salesEnd <= salesStart) return { ok: false, message: "Sales must end after they start." };
  const id = String(formData.get("id") ?? "");
  const current = id ? await prisma.ticketType.findUnique({ where: { id } }) : null;
  if (current && parsed.data.capacity < current.sold + current.reserved) {
    return { ok: false, message: "Capacity cannot be lower than tickets already sold or held." };
  }
  const data = {
    eventId: event.id,
    name: parsed.data.name,
    description: parsed.data.description,
    priceMinor,
    currency: parsed.data.currency.toUpperCase(),
    capacity: parsed.data.capacity,
    salesStart,
    salesEnd,
    minimumQuantity: parsed.data.minimumQuantity,
    maximumQuantity: parsed.data.maximumQuantity,
    benefits: parsed.data.benefits,
    status: parsed.data.status,
    isDemonstration: parsed.data.isDemonstration,
  };
  const saved = id ? await prisma.ticketType.update({ where: { id }, data }) : await prisma.ticketType.create({ data });
  await writeAudit(admin, id ? "ticket.update" : "ticket.create", "TicketType", saved.id, `${saved.name} ${saved.currency}`);
  refreshContent();
  return { ok: true, message: "Ticket saved. Existing registrations keep the price they paid." };
}
