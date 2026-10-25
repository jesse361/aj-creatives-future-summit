import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAdminEvent } from "@/lib/admin-data";

export const instant = false;

export default async function AdminHome() {
  const event = await getAdminEvent();
  if (!event) return <p>The event database has not been seeded.</p>;
  const [grouped, inquiries] = await Promise.all([
    prisma.registration.groupBy({ by: ["status"], where: { eventId: event.id }, _count: { _all: true } }),
    prisma.contactInquiry.count({ where: { eventId: event.id, status: "NEW" } }),
  ]);
  const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]));
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">{event.name}</h1>
      <p className="mt-2 text-slate">Update the public site from here. Changes are saved to the database.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Confirmed", counts.CONFIRMED ?? 0],
          ["Payment pending", counts.PENDING_PAYMENT ?? 0],
          ["New inquiries", inquiries],
          ["Places reserved", event.ticketTypes.reduce((sum, ticket) => sum + ticket.sold, 0)],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-3xl bg-white p-5">
            <p className="text-sm text-slate">{label}</p>
            <p className="mt-2 font-display text-3xl text-navy">{value}</p>
          </article>
        ))}
      </div>
      <ul className="mt-8 grid gap-3 text-sm font-semibold text-electric-deep sm:grid-cols-2">
        <li><Link href="/admin/event">Edit event details</Link></li>
        <li><Link href="/admin/registrations">Review registrations</Link></li>
        <li><Link href="/admin/inquiries">Read inquiries</Link></li>
        <li><Link href="/">View the public site</Link></li>
      </ul>
      <dl className="mt-8 grid gap-2 text-sm">
        <div>Date confirmed: {event.datesConfirmed ? "Yes" : "No"}</div>
        <div>Venue confirmed: {event.venue?.confirmed ? "Yes" : "No"}</div>
        <div>Publication: {event.status}</div>
      </dl>
    </div>
  );
}
