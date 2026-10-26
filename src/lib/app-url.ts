export function appUrl() {
  const value = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return value.replace(/\/$/, "");
}
