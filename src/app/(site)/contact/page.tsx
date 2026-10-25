import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { VenuePanel } from "@/components/venue-panel";
import { getPublishedEvent } from "@/lib/event-data";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getPublishedEvent();
  const title = `Contact · ${event?.name ?? "THE FUTURE SUMMIT 2027"} · AJ CREATIVES`;
  const description = "Contact AJ CREATIVES about The Future Summit. Public contact details appear only after the organizer adds them.";
  return { title, description, openGraph: { title, description } };
}

export default async function ContactPage() {
  const event = await getPublishedEvent();
  if (!event) notFound();
  return (
    <>
      <PageIntro eyebrow={event.settings.organizerName} title="Contact" description="Send a question about the summit. Messages are saved for the organizer and are not shown publicly." />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-6">
            <h2 className="font-display text-2xl text-navy">Organizer</h2>
            <p className="mt-3 font-medium text-navy">{event.settings.organizerName}</p>
            {event.settings.contactEmail ? (
              <a className="mt-3 block text-electric-deep" href={`mailto:${event.settings.contactEmail}`}>
                {event.settings.contactEmail}
              </a>
            ) : (
              <p className="mt-3 leading-7 text-slate">An inquiry email has not been published yet.</p>
            )}
            {event.settings.contactPhone ? <p className="mt-2">{event.settings.contactPhone}</p> : <p className="mt-2 text-slate">No public phone number has been added.</p>}
            {event.settings.socialLinks.length ? (
              <ul className="mt-4 space-y-2">
                {event.settings.socialLinks.map((link) => (
                  <li key={link.url}>
                    <a className="font-semibold text-electric-deep" href={link.url} rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate">Social links have not been added.</p>
            )}
          </div>
          <VenuePanel event={event} />
        </aside>
        <ContactForm />
      </div>
    </>
  );
}
