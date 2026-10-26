import Link from "next/link";
import { prisma } from "@/lib/db";

export const instant = false;

export default async function EventsAdmin() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-navy">Events</h1>
        <Link className="bg-electric px-4 py-3 text-xs uppercase tracking-[0.14em] text-white" href="/admin/events/new">New event</Link>
      </div>
      <table className="mt-6 w-full border border-line bg-white text-left text-sm">
        <thead className="bg-paper text-xs uppercase tracking-[0.12em] text-mist"><tr><th className="p-3">Title</th><th>Status</th><th>Starts</th><th></th></tr></thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-line">
              <td className="p-3">{event.title}{event.isDemonstration ? " · demo" : ""}</td>
              <td>{event.status}</td>
              <td>{event.startDate.toISOString().slice(0, 10)}</td>
              <td className="p-3 text-right"><Link className="text-electric" href={`/admin/events/${event.id}/edit`}>Edit</Link> {event.status === "PUBLISHED" ? <Link className="ml-3" href={`/events/${event.slug}`}>View</Link> : null}</td>
            </tr>
          ))}
          {events.length === 0 ? <tr><td className="p-4 text-ink-soft" colSpan={4}>No events yet.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
