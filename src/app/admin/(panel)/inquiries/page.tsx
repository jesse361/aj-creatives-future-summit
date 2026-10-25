import { updateInquiry } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { INQUIRY_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { inputClass } from "@/lib/styles";

export const instant = false;

export default async function InquiriesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event) return <p>The event database has not been seeded.</p>;
  const inquiries = await prisma.contactInquiry.findMany({ where: { eventId: event.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const label = (value: string) => INQUIRY_CATEGORIES.find((item) => item.value === value)?.label ?? value;
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Inquiries</h1>
      <AdminStatus saved={query.saved} error={query.error} />
      <div className="mt-6 grid gap-4">
        {inquiries.length === 0 ? <p className="rounded-3xl bg-white p-6">No inquiries yet.</p> : null}
        {inquiries.map((inquiry) => (
          <article key={inquiry.id} className="rounded-3xl bg-white p-5">
            <p className="text-sm text-slate">{label(inquiry.category)} · {inquiry.createdAt.toISOString()}</p>
            <h2 className="mt-2 font-display text-2xl text-navy">{inquiry.name}</h2>
            <p className="text-sm">{inquiry.email}</p>
            <p className="mt-3 whitespace-pre-wrap leading-7">{inquiry.message}</p>
            <form action={updateInquiry} className="mt-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={inquiry.id} />
              <select className={inputClass} name="status" defaultValue={inquiry.status}>
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <button className="text-sm font-semibold text-electric-deep">Update</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
