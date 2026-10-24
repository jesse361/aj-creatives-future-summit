import Link from "next/link";
import { cancelRegistration } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { prisma } from "@/lib/db";

export const metadata = { title: "Registrations" };

export default async function RegistrationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; q?: string; status?: string }>;
}) {
  const query = await searchParams;
  const q = query.q?.trim().toLowerCase() ?? "";
  const rows = await prisma.registration.findMany({
    where: query.status ? { status: query.status } : undefined,
    include: { ticketType: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const filtered = q
    ? rows.filter((row) =>
        [row.attendeeName, row.email, row.reference, row.organization ?? ""].join(" ").toLowerCase().includes(q),
      )
    : rows;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">Registrations</h1>
        <Link href="/api/admin/registrations/export" className="btn btn-ghost">Export CSV</Link>
      </div>
      <p className="mt-2 text-sm text-muted">This list contains personal data. Export it only for people managing the event. Visitors cannot open this page.</p>
      <AdminNotice saved={query.saved} error={query.error} />
      <form className="mt-4 flex flex-wrap gap-3" method="get">
        <label className="field min-w-56">
          <span className="sr-only">Search</span>
          <input name="q" defaultValue={query.q ?? ""} placeholder="Name, email, or reference" />
        </label>
        <label className="field">
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={query.status ?? ""}>
            <option value="">All statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <button className="btn btn-primary">Search</button>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="px-3">Reference</th>
              <th>Name</th>
              <th>Email</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="bg-white">
                <td className="rounded-l-xl px-3 py-3 font-medium">{row.reference}</td>
                <td>{row.attendeeName}</td>
                <td>{row.email}</td>
                <td>{row.ticketType.name}</td>
                <td>{row.quantity}</td>
                <td>{row.status}</td>
                <td>{row.paymentStatus}</td>
                <td className="rounded-r-xl pr-3">
                  {row.status !== "CANCELLED" ? (
                    <form action={cancelRegistration}>
                      <input type="hidden" name="id" value={row.id} />
                      <button className="text-[#9f1239]">Cancel</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="text-muted">No registrations match.</p> : null}
      </div>
    </div>
  );
}
