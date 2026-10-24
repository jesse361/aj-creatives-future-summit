export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function safeImageSrc(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) return value;
  const url = safeHttpUrl(value);
  if (!url?.startsWith("https:")) return null;
  return url;
}

export function safeMapEmbed(value: string | null | undefined) {
  const url = safeHttpUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") return null;
  const google =
    (parsed.hostname === "www.google.com" || parsed.hostname === "maps.google.com") &&
    parsed.pathname.includes("/maps/embed");
  const osm = parsed.hostname === "www.openstreetmap.org" && parsed.pathname.includes("/export/embed");
  return google || osm ? parsed.toString() : null;
}

export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "item";
}

export function createReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let reference = "AJS-";
  for (const byte of bytes) reference += alphabet[byte % alphabet.length];
  return reference;
}

export function toPublicRegistration(registration: {
  reference: string;
  attendeeName: string;
  quantity: number;
  status: string;
  paymentStatus: string;
  emailStatus: string;
  createdAt: Date;
  ticketType: { name: string; currency: string; priceMinor: number; isSample: boolean };
}) {
  return {
    reference: registration.reference,
    attendeeName: registration.attendeeName,
    quantity: registration.quantity,
    status: registration.status,
    paymentStatus: registration.paymentStatus,
    emailStatus: registration.emailStatus,
    createdAt: registration.createdAt.toISOString(),
    ticketName: registration.ticketType.name,
    currency: registration.ticketType.currency,
    priceMinor: registration.ticketType.priceMinor,
    isSamplePrice: registration.ticketType.isSample,
  };
}

export function paymentDecisionFromCheckout(session: {
  payment_status?: string | null;
  metadata?: { registrationId?: string } | null;
}) {
  if (session.payment_status !== "paid") return null;
  const registrationId = session.metadata?.registrationId;
  if (!registrationId) return null;
  return {
    registrationId,
    status: "CONFIRMED" as const,
    paymentStatus: "PAID" as const,
  };
}

export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    const name = typeof key === "string" ? key : "form";
    if (!errors[name]) errors[name] = issue.message;
  }
  if (!Object.keys(errors).length) errors.form = "Check the form and try again.";
  return errors;
}
