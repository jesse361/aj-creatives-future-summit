import Link from "next/link";
import { cancelRegistration } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { prisma } from "@/lib/db";
import { registrationWhere } from "@/lib/registration";
import { buttonClass, inputClass } from "@/lib/styles";
import { formatMoney } from "@/lib/money";

export const instant = false;

export default async function RegistrationsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event) return <p>The event database has not been seeded.</p>;
  const q = query.q ?? "";
  const status = query.status ?? "ALL";
  const registrations = await prisma.registration.findMany({
    where: registrationWhere(event.id, q, status),
    include: { ticketType: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const exportQuery = new URLSearchParams({ q, status });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">Registrations</h1>
        <Link href={`/admin/registrations/export?${exportQuery.toString()}`} className={buttonClass("primary")}>Export CSV</Link>
      </div>
      <AdminStatus saved={query.saved} error={query.error} />
      <form className="mt-6 flex flex-wrap gap-3">
        <label className="text-sm font-semibold text-navy">Search
          <input className={inputClass} name="q" defaultValue={q} placeholder="Name, email, or reference" />
        </label>
        <label className="text-sm font-semibold text-navy">Status
          <select className={inputClass} name="status" defaultValue={status}>
            <option value="ALL">All</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <button className={buttonClass("primary", "self-end")}>Filter</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate">
            <tr>
              {["Reference", "Name", "Email", "Ticket", "Qty", "Amount", "Status", ""].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={8}>No registrations match.</td></tr>
            ) : registrations.map((registration) => (
              <tr key={registration.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-navy">{registration.reference}</td>
                <td className="px-4 py-3">{registration.attendeeName}</td>
                <td className="px-4 py-3">{registration.email}</td>
                <td className="px-4 py-3">{registration.ticketType.name}</td>
                <td className="px-4 py-3">{registration.quantity}</td>
                <td className="px-4 py-3">{formatMoney(registration.amountCents, registration.currency)}</td>
                <td className="px-4 py-3">{registration.status}<br />{registration.paymentStatus}</td>
                <td className="px-4 py-3">
                  {registration.status !== "CANCELLED" ? (
                    <form action={cancelRegistration}>
                      <input type="hidden" name="id" value={registration.id} />
                      <button className="text-red-800">Cancel</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
