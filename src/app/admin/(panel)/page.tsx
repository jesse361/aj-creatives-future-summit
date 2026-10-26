import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const instant = false;

export default async function AdminHome() {
  await connection();
  const now = new Date();
  const [events, upcoming, registrations, confirmed, pending, speakers, inquiries, payments, tickets, activity] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED", endDate: { gte: now } } }),
    prisma.registration.count(),
    prisma.registration.count({ where: { registrationStatus: "CONFIRMED" } }),
    prisma.payment.count({ where: { paymentStatus: "PENDING" } }),
    prisma.speaker.count(),
    prisma.contactInquiry.count({ where: { status: "NEW" } }),
    prisma.payment.groupBy({ by: ["currency"], where: { paymentStatus: "SUCCESS" }, _sum: { amount: true } }),
    prisma.ticketType.aggregate({ _sum: { capacity: true, sold: true, reserved: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } }),
  ]);
  const remaining = (tickets._sum.capacity ?? 0) - (tickets._sum.sold ?? 0) - (tickets._sum.reserved ?? 0);
  const cards = [
    ["Events", events],
    ["Upcoming published", upcoming],
    ["Registrations", registrations],
    ["Confirmed", confirmed],
    ["Pending payments", pending],
    ["Speakers", speakers],
    ["New inquiries", inquiries],
    ["Ticket places left", remaining],
  ];
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Overview</h1>
      <p className="mt-2 text-sm text-ink-soft">Figures come from the database. Empty means nothing has been recorded yet.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="border border-line bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-mist">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </article>
        ))}
      </div>
      <section className="mt-8 border border-line bg-white p-5">
        <h2 className="font-display text-2xl">Verified revenue</h2>
        {payments.length ? (
          <ul className="mt-3 grid gap-2 text-sm">
            {payments.map((row) => <li key={row.currency}>{formatMoney(row._sum.amount ?? 0, row.currency)}</li>)}
          </ul>
        ) : <p className="mt-3 text-sm text-ink-soft">No verified payments yet.</p>}
      </section>
      <section className="mt-8 border border-line bg-white p-5">
        <h2 className="font-display text-2xl">Recent activity</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {activity.map((item) => <li key={item.id}>{item.summary} · {item.actor?.email ?? "system"}</li>)}
          {activity.length === 0 ? <li className="text-ink-soft">No administrative actions have been recorded.</li> : null}
        </ul>
        <Link className="mt-4 inline-block text-sm text-electric" href="/admin/events">Manage events</Link>
      </section>
    </div>
  );
}
