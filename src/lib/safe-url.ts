export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isSafeImageSrc(value: string) {
  if (!value || value.includes("..") || value.includes("\\")) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return isHttpUrl(value) && value.startsWith("https://");
}

export function isSafeEmbedUrl(value: string) {
  if (!isHttpUrl(value)) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname;
    const allowed =
      host === "www.google.com" ||
      host === "maps.google.com" ||
      host === "www.openstreetmap.org";
    return allowed && (url.pathname.includes("/maps") || url.pathname.includes("/export/embed"));
  } catch {
    return false;
  }
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/admin";
  }
  return value;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return slug || "item";
}
