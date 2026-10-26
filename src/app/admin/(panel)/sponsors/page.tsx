import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { inputClass, labelClass } from "@/lib/styles";
import { saveSponsor } from "@/server/actions/admin-office";

export const instant = false;

export default async function SponsorsAdmin({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [sponsors, current] = await Promise.all([
    prisma.sponsor.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
    id ? prisma.sponsor.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Sponsors</h1>
      <p className="text-sm text-ink-soft">Only approved sponsors appear on the public site. Do not approve a partner that has not agreed to be listed.</p>
      <ul className="grid gap-2 text-sm">{sponsors.map((sponsor) => <li key={sponsor.id}><a className="text-electric" href={`/admin/sponsors?id=${sponsor.id}`}>{sponsor.name}</a> · {sponsor.tier} · {sponsor.status}</li>)}</ul>
      <AdminForm action={saveSponsor}>
        {current ? <input type="hidden" name="id" value={current.id} /> : null}
        <label className={labelClass}>Name<input className={inputClass} name="name" required defaultValue={current?.name ?? ""} /></label>
        <label className={labelClass}>Logo URL<input className={inputClass} name="logo" defaultValue={current?.logo ?? ""} /></label>
        <label className={labelClass}>Logo alt<input className={inputClass} name="logoAlt" defaultValue={current?.logoAlt ?? ""} /></label>
        <label className={labelClass}>Website<input className={inputClass} name="website" defaultValue={current?.website ?? ""} /></label>
        <label className={labelClass}>Tier<input className={inputClass} name="tier" defaultValue={current?.tier ?? "Partner"} /></label>
        <label className={labelClass}>Order<input className={inputClass} type="number" name="displayOrder" defaultValue={current?.displayOrder ?? 0} /></label>
        <label className={labelClass}>Status<select className={inputClass} name="status" defaultValue={current?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="HIDDEN">Hidden</option></select></label>
      </AdminForm>
    </div>
  );
}
