import { prisma } from "@/lib/db";
import { EVENT_SLUG } from "@/lib/constants";

export const metadata = { title: "Admin" };

export default async function AdminHome() {
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } });
  const [speakers, sessions, tickets, registrations, inquiries] = await Promise.all([
    prisma.speaker.count(),
    prisma.session.count(),
    prisma.ticketType.count(),
    prisma.registration.count(),
    prisma.contactInquiry.count({ where: { status: "NEW" } }),
  ]);
  const cards = [
    ["Speakers", speakers],
    ["Sessions", sessions],
    ["Ticket types", tickets],
    ["Registrations", registrations],
    ["New inquiries", inquiries],
  ];
  return (
    <div>
      <h1 className="text-4xl">Dashboard</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {event ? `${event.name} is ${event.status.toLowerCase()}.` : "No event record found."}{" "}
        {event?.datesConfirmed ? "The date is marked confirmed." : "The date is not confirmed, so the public site keeps the countdown labeled as a demonstration."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="surface-card p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-display text-4xl text-navy">{value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
