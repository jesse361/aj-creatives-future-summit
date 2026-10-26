import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { BENEFITS, TAGS } from "@/lib/constants";
import { isHttpUrl } from "@/lib/safe-url";
import type { SocialLink } from "@/lib/types";

export type PublicSettings = {
  brandName: string;
  legalName: string;
  tagline: string;
  secondaryTagline: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: SocialLink[];
  defaultCurrency: string;
  announcementEnabled: boolean;
  announcement: string;
  footerContent: string;
  seoTitle: string;
  seoDescription: string;
  registrationHoldMinutes: number;
};

const fallback: PublicSettings = {
  brandName: "WHY US",
  legalName: "WHY US — Events & Conference Hub",
  tagline: "Where Ideas Meet. Where Connections Begin.",
  secondaryTagline: "Bringing People, Ideas, and Opportunities Together.",
  logoUrl: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  socialLinks: [],
  defaultCurrency: "GHS",
  announcementEnabled: false,
  announcement: "",
  footerContent: "WHY US brings people, ideas, and opportunities together through conferences, summits, workshops, and private gatherings.",
  seoTitle: "WHY US — Events & Conference Hub",
  seoDescription: "Discover exceptional conferences, connect with inspiring people, and experience events designed to turn ideas into opportunities.",
  registrationHoldMinutes: 30,
};

function readSocials(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const label = "label" in item ? String(item.label) : "";
    const url = "url" in item ? String(item.url) : "";
    if (!label || !isHttpUrl(url)) return [];
    return [{ label, url }];
  });
}

export async function getSettings(): Promise<PublicSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "site" } });
    if (!row) return fallback;
    return {
      brandName: row.brandName,
      legalName: row.legalName,
      tagline: row.tagline,
      secondaryTagline: row.secondaryTagline,
      logoUrl: row.logoUrl,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      address: row.address,
      socialLinks: readSocials(row.socialLinks),
      defaultCurrency: row.defaultCurrency,
      announcementEnabled: row.announcementEnabled && row.announcement.trim().length > 0,
      announcement: row.announcement,
      footerContent: row.footerContent || fallback.footerContent,
      seoTitle: row.seoTitle || fallback.seoTitle,
      seoDescription: row.seoDescription || fallback.seoDescription,
      registrationHoldMinutes: row.registrationHoldMinutes,
    };
  } catch (error) {
    console.error("Settings are unavailable.", error);
    return fallback;
  }
}

export async function getPage(key: string) {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  try {
    return await prisma.pageContent.findUnique({ where: { key } });
  } catch (error) {
    console.error("Page content is unavailable.", error);
    return null;
  }
}

export function benefitItems(body: string | null | undefined) {
  if (!body) return [...BENEFITS];
  try {
    const parsed = JSON.parse(body) as { title?: string; description?: string }[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...BENEFITS];
    return parsed
      .filter((item) => item.title && item.description)
      .map((item) => ({ title: String(item.title), description: String(item.description) }));
  } catch {
    return [...BENEFITS];
  }
}
