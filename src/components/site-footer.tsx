import Link from "next/link";
import { cacheLife } from "next/cache";
import type { PublicSettings } from "@/lib/settings";
import { NewsletterForm } from "@/components/newsletter-form";

async function copyrightYear() {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 86400, expire: 604800 });
  return new Date().getFullYear();
}

export async function SiteFooter({ settings }: { settings: PublicSettings }) {
  const year = await copyrightYear();
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <p className="font-display text-2xl tracking-[0.18em]">{settings.brandName}</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-mist">{settings.footerContent}</p>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Explore</p>
          <ul className="mt-4 grid gap-2 text-sm text-white/85">
            <li><Link href="/events">Events</Link></li>
            <li><Link href="/speakers">Speakers</Link></li>
            <li><Link href="/schedule">Schedule</Link></li>
            <li><Link href="/tickets">Tickets</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Contact</p>
          <ul className="mt-4 grid gap-2 text-sm text-white/85">
            {settings.contactEmail ? <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li> : <li>Email not published yet</li>}
            {settings.contactPhone ? <li>{settings.contactPhone}</li> : null}
            {settings.address ? <li className="whitespace-pre-line">{settings.address}</li> : <li>Address not published yet</li>}
            {settings.socialLinks.map((link) => (
              <li key={link.url}><a href={link.url}>{link.label}</a></li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Newsletter</p>
          <div className="mt-4">
            <NewsletterForm compact />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs uppercase tracking-[0.14em] text-mist sm:px-6 lg:px-8">
          <p>© {year} {settings.legalName}</p>
          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
