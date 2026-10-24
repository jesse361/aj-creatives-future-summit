import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import type { SiteData } from "@/lib/event-data";

const socialLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  website: "Website",
};

export function Footer({ data }: { data: SiteData | null }) {
  const year = new Date().getFullYear();
  const settings = data?.settings;
  const event = data?.event;
  const socials = Object.entries(settings?.socialLinks ?? {}).filter((entry) => entry[1]);

  return (
    <footer className="theme-dark bg-navy text-mist">
      <div className="page-wrap grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-lg tracking-[0.16em] text-white">AJ CREATIVES</p>
          <p className="mt-4 max-w-md text-sm leading-6">
            {event?.description ??
              "AJ Creatives presents The Future Summit 2027. Ideas That Shape Tomorrow. Dates, venue, speakers, and prices on this site stay labeled until the organizer confirms them."}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-[0.14em] text-white">EXPLORE</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Registration terms
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-[0.14em] text-white">CONTACT</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {settings?.contactEmail ? (
              <a className="hover:text-white" href={`mailto:${settings.contactEmail}`}>
                {settings.contactEmail}
              </a>
            ) : (
              <p>Event contact email has not been published.</p>
            )}
            {settings?.contactPhone ? <p>{settings.contactPhone}</p> : null}
            {event?.venueConfirmed && event.venueName ? (
              <p>
                {event.venueName}
                {event.venueCity ? `, ${event.venueCity}` : ""}
                {event.venueCountry ? `, ${event.venueCountry}` : ""}
              </p>
            ) : (
              <p>Venue details coming soon.</p>
            )}
            {socials.length ? (
              <ul className="mt-2 flex flex-wrap gap-3">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} className="hover:text-white" rel="noreferrer">
                      {socialLabels[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Social profiles will appear here once the organizer publishes them.</p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-wrap flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} AJ CREATIVES. All rights reserved.</p>
          <p>Placeholder details are not confirmed event facts.</p>
        </div>
      </div>
    </footer>
  );
}
