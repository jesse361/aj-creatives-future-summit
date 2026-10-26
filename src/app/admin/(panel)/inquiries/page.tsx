import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { inputClass, labelClass } from "@/lib/styles";
import { updateInquiry } from "@/server/actions/admin-office";

export const instant = false;

export default async function InquiriesAdmin({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; id?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const inquiries = await prisma.contactInquiry.findMany({
    where: {
      ...(params.category ? { category: params.category } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const current = params.id ? inquiries.find((item) => item.id === params.id) ?? await prisma.contactInquiry.findUnique({ where: { id: params.id } }) : null;
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Inquiries</h1>
      <form className="flex flex-wrap gap-3" action="/admin/inquiries">
        <input className={inputClass} name="q" defaultValue={q} placeholder="Search" />
        <select className={inputClass} name="category" defaultValue={params.category ?? ""}>
          <option value="">All categories</option>
          {["GENERAL", "TICKETS", "SPONSORSHIP", "SPEAKING", "PARTNERSHIPS", "ACCESSIBILITY"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="bg-navy px-4 text-xs uppercase tracking-[0.14em] text-white">Filter</button>
      </form>
      <ul className="grid gap-2 text-sm">
        {inquiries.map((item) => <li key={item.id}><a className="text-electric" href={`/admin/inquiries?id=${item.id}`}>{item.subject}</a> · {item.status} · {item.category}</li>)}
      </ul>
      {current ? (
        <AdminForm action={updateInquiry} submitLabel="Update inquiry">
          <input type="hidden" name="id" value={current.id} />
          <p className="text-sm">{current.name} · {current.email}</p>
          <p className="whitespace-pre-line text-sm leading-6">{current.message}</p>
          <label className={labelClass}>Status<select className={inputClass} name="status" defaultValue={current.status}><option>NEW</option><option>REVIEWED</option><option>CLOSED</option></select></label>
          <label className={labelClass}>Internal notes<textarea className={inputClass} name="notes" defaultValue={current.notes} /></label>
        </AdminForm>
      ) : null}
    </div>
  );
}
