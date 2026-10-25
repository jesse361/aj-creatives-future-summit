import Link from "next/link";
import { CopyrightYear } from "@/components/copyright-year";
import type { PublicEvent } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/speakers", label: "Speakers" },
  { href: "/schedule", label: "Schedule" },
  { href: "/tickets", label: "Tickets" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter({ event }: { event: PublicEvent | null }) {
  const venue = event?.venue.confirmed
    ? [event.venue.name, event.venue.streetAddress, event.venue.city, event.venue.country].filter(Boolean).join(", ")
    : "";

  return (
    <footer className="bg-navy text-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-lg font-semibold tracking-[0.16em] text-white">AJ CREATIVES</p>
          <p className="mt-3 leading-7">{event?.tagline ?? "Ideas That Shape Tomorrow."}</p>
          <p className="mt-3 text-sm leading-6">{event?.description ?? "A summit for technology, creativity, and professional connection."}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Explore</h2>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Contact</h2>
          {event?.settings.contactEmail ? (
            <a className="mt-4 block hover:text-white" href={`mailto:${event.settings.contactEmail}`}>
              {event.settings.contactEmail}
            </a>
          ) : (
            <p className="mt-4 leading-7">A public email has not been published yet. Use the contact form.</p>
          )}
          {event?.settings.contactPhone ? <p className="mt-2">{event.settings.contactPhone}</p> : null}
          {event?.settings.socialLinks.length ? (
            <ul className="mt-4 space-y-2">
              {event.settings.socialLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} className="hover:text-white" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6">Social links will appear after the organizer adds them.</p>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">Visit</h2>
          <p className="mt-4 leading-7">{venue || "Venue details coming soon."}</p>
          <ul className="mt-4 space-y-2">
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
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm">
        © <CopyrightYear /> AJ CREATIVES. All rights reserved.
      </div>
    </footer>
  );
}
