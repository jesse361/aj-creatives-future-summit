import type { MetadataRoute } from "next";
import { getPublishedEvent } from "@/lib/event-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const event = await getPublishedEvent();
  const staticRoutes = ["", "/speakers", "/schedule", "/tickets", "/contact", "/privacy", "/terms"].map((path) => ({
    url: `${site}${path || "/"}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  const speakers = (event?.speakers ?? []).map((speaker) => ({
    url: `${site}/speakers/${speaker.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  return [...staticRoutes, ...speakers];
}
