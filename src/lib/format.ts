export function eventPlace(event: { eventFormat: string; venueName?: string | null; city?: string | null }) {
  if (event.eventFormat === "ONLINE") return "Online";
  const place = [event.venueName, event.city].filter(Boolean).join(", ");
  if (event.eventFormat === "HYBRID") return place ? `${place} and online` : "Hybrid";
  return place || "Location to be confirmed";
}

export function coverSrc(src: string | null | undefined) {
  if (src && (src.startsWith("/") || src.startsWith("https://"))) return src;
  return "/images/hero.jpg";
}
