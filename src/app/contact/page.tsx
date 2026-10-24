import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AJ Creatives about The Future Summit 2027. Inquiries are saved for the organizer.",
};

export default async function ContactPage() {
  const data = await getSiteData();
  const settings = data?.settings;
  const event = data?.event;
  const socials = Object.entries(settings?.socialLinks ?? {});
  return (
    <main className="page-wrap py-16">
      <p className="text-xs tracking-[0.22em] text-action">AJ CREATIVES</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Contact</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Send a question about the summit. Messages are validated and stored. They are forwarded by email only when that service is configured.
      </p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="grid h-fit gap-4">
          <section className="surface-card p-6">
            <h2 className="text-2xl">Organizer</h2>
            <p className="mt-2">{settings?.organizerName ?? "AJ Creatives"}</p>
            {settings?.contactEmail ? (
              <a className="mt-3 block text-action" href={`mailto:${settings.contactEmail}`}>
                {settings.contactEmail}
              </a>
            ) : (
              <p className="mt-3 text-sm text-muted">An event inquiry email has not been published yet. Use the form and the message will be saved.</p>
            )}
            {settings?.contactPhone ? <p className="mt-2 text-sm">{settings.contactPhone}</p> : null}
            {socials.length ? (
              <ul className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} rel="noreferrer" className="text-action">
                      {key}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">Social links have not been added.</p>
            )}
          </section>
          <section className="surface-card p-6">
            <h2 className="text-2xl">Venue</h2>
            {event?.venueConfirmed && event.venueName ? (
              <>
                <p className="mt-2">{event.venueName}</p>
                <p className="mt-1 text-sm text-muted">
                  {[event.venueAddress, event.venueCity, event.venueCountry].filter(Boolean).join(", ")}
                </p>
                {event.hoursLabel ? <p className="mt-3 text-sm">{event.hoursLabel}</p> : null}
                {event.transitInfo ? <p className="mt-3 text-sm leading-6">{event.transitInfo}</p> : null}
                {event.parkingInfo ? <p className="mt-3 text-sm leading-6">{event.parkingInfo}</p> : null}
                {event.accessibilityInfo ? <p className="mt-3 text-sm leading-6">{event.accessibilityInfo}</p> : null}
                {event.accommodationInfo ? <p className="mt-3 text-sm leading-6">{event.accommodationInfo}</p> : null}
                {event.directionsUrl ? (
                  <a className="mt-3 inline-flex text-sm font-semibold text-action" href={event.directionsUrl}>
                    Directions
                  </a>
                ) : null}
                {event.mapEmbedUrl ? (
                  <iframe title="Venue map" src={event.mapEmbedUrl} className="mt-4 h-56 w-full rounded-2xl border-0" loading="lazy" />
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">Venue details coming soon. Travel, parking, and accommodation notes are shown only after the organizer confirms them.</p>
            )}
          </section>
        </aside>
        <ContactForm />
      </div>
    </main>
  );
}
