import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = appUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/register/success", "/newsletter/unsubscribe"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
