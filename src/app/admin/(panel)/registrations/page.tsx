import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { canExportAttendees } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { inputClass } from "@/lib/styles";
import { cancelRegistrationAction, resendRegistrationAction } from "@/server/actions/admin-office";

export const instant = false;

export default async function RegistrationsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; eventId?: string; status?: string }> }) {
  const params = await searchParams;
  const admin = await getCurrentAdmin();
  const q = params.q?.trim() ?? "";
  const events = await prisma.event.findMany({ orderBy: { title: "asc" } });
  const registrations = await prisma.registration.findMany({
    where: {
      ...(params.eventId ? { eventId: params.eventId } : {}),
      ...(params.status ? { registrationStatus: params.status as "CONFIRMED" } : {}),
      ...(q ? { OR: [{ attendeeName: { contains: q, mode: "insensitive" } }, { attendeeEmail: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { event: true, payment: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const exportQuery = new URLSearchParams();
  if (params.eventId) exportQuery.set("eventId", params.eventId);
  if (params.status) exportQuery.set("status", params.status);
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Registrations</h1>
      <form className="mt-6 flex flex-wrap gap-3" action="/admin/registrations">
        <input className={inputClass} name="q" placeholder="Name, email, or reference" defaultValue={q} />
        <select className={inputClass} name="eventId" defaultValue={params.eventId ?? ""}>
          <option value="">All events</option>
          {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
        <select className={inputClass} name="status" defaultValue={params.status ?? ""}>
          <option value="">Any status</option>
          {["CONFIRMED", "PENDING_PAYMENT", "CANCELLED", "EXPIRED", "FAILED"].map((status) => <option key={status}>{status}</option>)}
        </select>
        <button className="bg-navy px-4 text-xs uppercase tracking-[0.14em] text-white">Filter</button>
      </form>
      {admin && canExportAttendees(admin.role) ? <p className="mt-4 text-sm"><Link className="text-electric" href={`/admin/registrations/export?${exportQuery.toString()}`}>Export CSV</Link></p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full bg-white text-left text-sm">
          <thead><tr className="text-xs uppercase tracking-[0.12em] text-mist"><th className="p-2">Reference</th><th>Attendee</th><th>Event</th><th>Status</th><th>Payment</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id} className="border-t border-line align-top">
                <td className="p-2">{registration.reference}</td>
                <td>{registration.attendeeName}<br />{registration.attendeeEmail}</td>
                <td>{registration.event.title}</td>
                <td>{registration.registrationStatus}</td>
                <td>{registration.payment?.paymentStatus ?? "—"}</td>
                <td>{formatMoney(registration.totalAmount, registration.currency)}</td>
                <td className="grid gap-2 p-2">
                  <form action={resendRegistrationAction}><input type="hidden" name="id" value={registration.id} /><button className="text-electric">Resend</button></form>
                  <form action={cancelRegistrationAction}><input type="hidden" name="id" value={registration.id} /><button className="text-red-800">Cancel</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 ? <p className="mt-4 text-sm text-ink-soft">No registrations match.</p> : null}
      </div>
    </div>
  );
}
