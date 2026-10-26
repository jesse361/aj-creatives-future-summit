import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });
const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "WHY US — Events & Conference Hub", template: "%s · WHY US" },
  description: "Discover exceptional conferences, connect with inspiring people, and experience events designed to turn ideas into opportunities.",
  applicationName: "WHY US",
  openGraph: {
    title: "WHY US — Events & Conference Hub",
    description: "Where Ideas Meet. Where Connections Begin.",
    siteName: "WHY US",
    type: "website",
    images: [{ url: "/images/hero.jpg", width: 1800, height: 1200, alt: "Illustrative photograph of a conference audience. Not a confirmed WHY US event." }],
  },
  twitter: { card: "summary_large_image", title: "WHY US", description: "Where Ideas Meet. Where Connections Begin.", images: ["/images/hero.jpg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
