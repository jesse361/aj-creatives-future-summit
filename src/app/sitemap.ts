import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const staticRoutes = ["", "/events", "/speakers", "/schedule", "/tickets", "/about", "/contact", "/faq", "/privacy", "/terms", "/register"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  try {
    const [events, speakers] = await Promise.all([
      prisma.event.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      prisma.speaker.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticRoutes,
      ...events.map((event) => ({ url: `${base}/events/${event.slug}`, lastModified: event.updatedAt })),
      ...speakers.map((speaker) => ({ url: `${base}/speakers/${speaker.slug}`, lastModified: speaker.updatedAt })),
    ];
  } catch {
    return staticRoutes;
  }
}
