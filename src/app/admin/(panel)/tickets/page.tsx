import { saveTicket } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/security";

export const metadata = { title: "Manage tickets" };

export default async function TicketsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const query = await searchParams;
  const tickets = await prisma.ticketType.findMany({ orderBy: { sortOrder: "asc" } });
  const editing = tickets.find((ticket) => ticket.id === query.edit);
  const benefits = parseJson<string[]>(editing?.benefits, []).join("\n");

  return (
    <div>
      <h1 className="text-4xl">Tickets</h1>
      <p className="mt-2 text-sm text-muted">Prices are stored in minor units. Visitors cannot set the price. Mark sample prices until the organizer confirms official rates.</p>
      <AdminNotice saved={query.saved} error={query.error} />
      <ul className="mt-6 grid gap-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="surface-card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{ticket.name}</p>
              <p className="text-sm text-muted">{formatMoney(ticket.priceMinor, ticket.currency)} · {ticket.sold}/{ticket.capacity} reserved{ticket.isSample ? " · Sample" : ""}</p>
            </div>
            <a className="text-sm font-semibold text-action" href={`/admin/tickets?edit=${ticket.id}`}>Edit</a>
          </li>
        ))}
      </ul>
      <form action={saveTicket} className="surface-card mt-8 grid gap-4 p-6">
        <h2 className="text-2xl">{editing ? "Edit ticket" : "Add a ticket"}</h2>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <label className="field">Name<input name="name" defaultValue={editing?.name ?? ""} required /></label>
        <label className="field">Description<textarea name="description" defaultValue={editing?.description ?? ""} /></label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="field">Price<input name="price" defaultValue={editing ? (editing.priceMinor / 100).toFixed(2) : "0.00"} required /></label>
          <label className="field">Currency<input name="currency" defaultValue={editing?.currency ?? "USD"} required /></label>
          <label className="field">Capacity<input name="capacity" type="number" defaultValue={editing?.capacity ?? 100} required /></label>
        </div>
        <label className="field">Benefits, one per line<textarea name="benefits" defaultValue={benefits} /></label>
        <label className="field">Eligibility note<input name="eligibilityNote" defaultValue={editing?.eligibilityNote ?? ""} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Sales start<input type="datetime-local" name="salesStart" defaultValue={editing?.salesStart ? editing.salesStart.toISOString().slice(0, 16) : ""} /></label>
          <label className="field">Sales end<input type="datetime-local" name="salesEnd" defaultValue={editing?.salesEnd ? editing.salesEnd.toISOString().slice(0, 16) : ""} /></label>
        </div>
        <label className="field">Display order<input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? tickets.length} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? false} /> Sample price</label>
        <button className="btn btn-primary w-fit">Save ticket</button>
      </form>
    </div>
  );
}
