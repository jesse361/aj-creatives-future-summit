import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteData } from "@/lib/event-data";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Future Summit 2027 | AJ Creatives",
    template: "%s | The Future Summit 2027",
  },
  description:
    "AJ Creatives presents The Future Summit 2027. Ideas That Shape Tomorrow. A technology and innovation summit for founders, students, designers, and builders. Dates, venue, speakers, and prices are confirmed only when labeled as such.",
  openGraph: {
    title: "The Future Summit 2027 | AJ Creatives",
    description: "Ideas That Shape Tomorrow. A summit presented by AJ Creatives.",
    type: "website",
    images: [{ url: "/images/hero.jpg", width: 1800, height: 1200, alt: "Audience seated in a conference hall during a keynote" }],
  },
};

export const revalidate = 60;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const data = await getSiteData();
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <Header />
        <div id="content">{children}</div>
        <Footer data={data} />
      </body>
    </html>
  );
}
