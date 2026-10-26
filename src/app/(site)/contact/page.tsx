import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/ui";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact", description: "Contact WHY US about events, tickets, speaking, and partnerships." };

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to WHY US" description="Messages are stored for the organizer. Public contact details appear here only after they are saved in the dashboard." />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <ContactForm />
        <aside className="grid h-fit gap-4 border border-line bg-white p-6 text-sm leading-6">
          <h2 className="font-display text-2xl text-navy">Direct</h2>
          <p>{settings.contactEmail || "Email not published yet."}</p>
          <p>{settings.contactPhone || "Phone not published yet."}</p>
          <p className="whitespace-pre-line">{settings.address || "Address not published yet."}</p>
          <ul className="grid gap-2">
            {settings.socialLinks.map((link) => <li key={link.url}><a className="underline" href={link.url}>{link.label}</a></li>)}
          </ul>
          <Link className="text-electric" href="/faq">Read the FAQ</Link>
        </aside>
      </div>
    </>
  );
}
