import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { inputClass, labelClass } from "@/lib/styles";
import { utcToZonedInput } from "@/lib/time";
import { saveTicket } from "@/server/actions/admin-content";

export const instant = false;

export default async function TicketsAdmin({ searchParams }: { searchParams: Promise<{ eventId?: string; id?: string }> }) {
  const params = await searchParams;
  const events = await prisma.event.findMany({ orderBy: { startDate: "desc" } });
  const eventId = params.eventId || events[0]?.id || "";
  const event = events.find((item) => item.id === eventId);
  const [tickets, current] = await Promise.all([
    eventId ? prisma.ticketType.findMany({ where: { eventId }, orderBy: { priceMinor: "asc" } }) : Promise.resolve([]),
    params.id ? prisma.ticketType.findUnique({ where: { id: params.id } }) : Promise.resolve(null),
  ]);
  const zone = event?.timezone || "Africa/Accra";
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Tickets</h1>
      <form action="/admin/tickets" className="flex gap-3">
        <select className={inputClass} name="eventId" defaultValue={eventId}>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <button className="bg-navy px-4 text-xs uppercase tracking-[0.14em] text-white">Show</button>
      </form>
      <table className="w-full bg-white text-left text-sm">
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b border-line">
              <td className="py-2">{ticket.name}</td>
              <td>{formatMoney(ticket.priceMinor, ticket.currency)}</td>
              <td>{ticket.sold} sold · {ticket.reserved} held · {ticket.capacity} cap</td>
              <td><a className="text-electric" href={`/admin/tickets?eventId=${ticket.eventId}&id=${ticket.id}`}>Edit</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminForm action={saveTicket} submitLabel={current ? "Update ticket" : "Create ticket"}>
        {current ? <input type="hidden" name="id" value={current.id} /> : null}
        <input type="hidden" name="eventId" value={current?.eventId || eventId} />
        <label className={labelClass}>Name<input className={inputClass} name="name" required defaultValue={current?.name ?? ""} /></label>
        <label className={labelClass}>Description<textarea className={inputClass} name="description" defaultValue={current?.description ?? ""} /></label>
        <label className={labelClass}>Price<input className={inputClass} name="price" required defaultValue={current ? (current.priceMinor / 100).toFixed(2) : ""} /></label>
        <label className={labelClass}>Currency<input className={inputClass} name="currency" defaultValue={current?.currency ?? "GHS"} /></label>
        <label className={labelClass}>Capacity<input className={inputClass} type="number" name="capacity" required defaultValue={current?.capacity ?? 100} /></label>
        <label className={labelClass}>Minimum<input className={inputClass} type="number" name="minimumQuantity" defaultValue={current?.minimumQuantity ?? 1} /></label>
        <label className={labelClass}>Maximum<input className={inputClass} type="number" name="maximumQuantity" defaultValue={current?.maximumQuantity ?? 8} /></label>
        <label className={labelClass}>Sales start<input className={inputClass} type="datetime-local" name="salesStart" defaultValue={current?.salesStart ? utcToZonedInput(current.salesStart.toISOString(), zone) : ""} /></label>
        <label className={labelClass}>Sales end<input className={inputClass} type="datetime-local" name="salesEnd" defaultValue={current?.salesEnd ? utcToZonedInput(current.salesEnd.toISOString(), zone) : ""} /></label>
        <label className={labelClass}>Benefits, one per line<textarea className={inputClass} name="benefits" defaultValue={current?.benefits.join("\n") ?? ""} /></label>
        <label className={labelClass}>Status<select className={inputClass} name="status" defaultValue={current?.status ?? "ACTIVE"}><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></select></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isDemonstration" defaultChecked={current?.isDemonstration ?? false} /> Demonstration price</label>
      </AdminForm>
    </div>
  );
}
