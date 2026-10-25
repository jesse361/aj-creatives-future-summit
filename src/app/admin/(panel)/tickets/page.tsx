import Link from "next/link";
import { deleteTicket, saveTicket } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import { utcToZonedInput } from "@/lib/time";

export const instant = false;

function benefits(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").join("\n") : "";
  } catch {
    return "";
  }
}

export default async function TicketsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event) return <p>The event database has not been seeded.</p>;
  const editing = query.edit === "new" ? null : event.ticketTypes.find((ticket) => ticket.id === query.edit);
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">Tickets</h1>
        <Link href="/admin/tickets?edit=new" className={buttonClass("primary")}>Add ticket</Link>
      </div>
      <AdminStatus saved={query.saved} error={query.error} />
      <ul className="grid gap-3">
        {event.ticketTypes.map((ticket) => (
          <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
            <span>{ticket.name} · {(ticket.priceCents / 100).toFixed(2)} {ticket.currency} · {ticket.sold}/{ticket.capacity} reserved</span>
            <span className="flex gap-3">
              <Link className="text-sm font-semibold text-electric-deep" href={`/admin/tickets?edit=${ticket.id}`}>Edit</Link>
              <form action={deleteTicket}><input type="hidden" name="id" value={ticket.id} /><button className="text-sm text-red-800">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
      {query.edit ? (
        <form action={saveTicket} className="grid max-w-3xl gap-4 rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-navy">{editing ? "Edit ticket" : "New ticket"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className={labelClass}>Name<input className={inputClass} name="name" defaultValue={editing?.name ?? ""} required /></label>
          <label className={labelClass}>Slug<input className={inputClass} name="slug" defaultValue={editing?.slug ?? ""} /></label>
          <label className={labelClass}>Description<textarea className={inputClass} name="description" rows={3} defaultValue={editing?.description ?? ""} /></label>
          <label className={labelClass}>Price<input className={inputClass} name="price" defaultValue={editing ? (editing.priceCents / 100).toFixed(2) : "0.00"} required /></label>
          <label className={labelClass}>Currency<input className={inputClass} name="currency" defaultValue={editing?.currency ?? event.settings?.currency ?? "USD"} required /></label>
          <label className={labelClass}>Capacity<input className={inputClass} name="capacity" type="number" min={0} defaultValue={editing?.capacity ?? 0} required /></label>
          {editing ? <p className="text-sm text-slate">{editing.sold} places are already reserved. Capacity cannot drop below that.</p> : null}
          <label className={labelClass}>Benefits, one per line<textarea className={inputClass} name="benefits" rows={4} defaultValue={editing ? benefits(editing.benefits) : ""} /></label>
          <label className={labelClass}>Eligibility note<textarea className={inputClass} name="eligibilityNote" rows={2} defaultValue={editing?.eligibilityNote ?? ""} /></label>
          <label className={labelClass}>Sales start<input className={inputClass} type="datetime-local" name="salesStart" defaultValue={editing?.salesStart ? utcToZonedInput(editing.salesStart.toISOString(), event.timezone) : ""} /></label>
          <label className={labelClass}>Sales end<input className={inputClass} type="datetime-local" name="salesEnd" defaultValue={editing?.salesEnd ? utcToZonedInput(editing.salesEnd.toISOString(), event.timezone) : ""} /></label>
          <label className={labelClass}>Display order<input className={inputClass} name="displayOrder" type="number" defaultValue={editing?.displayOrder ?? 0} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? true} /> Sample price</label>
          <button className={buttonClass("primary", "w-fit")}>Save ticket</button>
        </form>
      ) : null}
    </div>
  );
}
