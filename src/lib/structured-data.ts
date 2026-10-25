import type { PublicEvent } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";

export function buildStructuredData(event: PublicEvent, siteUrl: string) {
  const publisher = { "@type": "Organization", name: event.settings.organizerName || "AJ CREATIVES" };
  if (!event.datesConfirmed || !event.startAt) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: event.name,
      description: event.description,
      url: siteUrl,
      publisher,
    };
  }

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description,
    startDate: event.startAt,
    url: siteUrl,
    organizer: publisher,
  };
  if (event.endAt) data.endDate = event.endAt;
  if (event.formatConfirmed && event.format && FORMAT_LABELS[event.format]) {
    data.eventAttendanceMode =
      event.format === "VIRTUAL"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.format === "HYBRID"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode";
  }
  if (event.venue.confirmed && event.venue.name) {
    data.location = {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        ...(event.venue.streetAddress ? { streetAddress: event.venue.streetAddress } : {}),
        ...(event.venue.city ? { addressLocality: event.venue.city } : {}),
        ...(event.venue.country ? { addressCountry: event.venue.country } : {}),
      },
    };
  }
  return data;
}
