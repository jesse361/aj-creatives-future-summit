import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "THE FUTURE SUMMIT 2027 · AJ CREATIVES",
    template: "%s",
  },
  description:
    "AJ CREATIVES presents The Future Summit 2027. Ideas That Shape Tomorrow. Dates, venue, speakers, and prices are shown only when the organizer confirms them.",
  applicationName: "The Future Summit 2027",
  openGraph: {
    title: "THE FUTURE SUMMIT 2027 · AJ CREATIVES",
    description:
      "A technology and innovation summit presented by AJ CREATIVES. Confirmed event details will replace the placeholders on this site.",
    siteName: "AJ CREATIVES",
    type: "website",
    images: [
      {
        url: "/images/hero.jpg",
        width: 2000,
        height: 1333,
        alt: "Illustrative photograph of a conference audience. Not a photograph of The Future Summit.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE FUTURE SUMMIT 2027 · AJ CREATIVES",
    description: "Ideas That Shape Tomorrow.",
    images: ["/images/hero.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
