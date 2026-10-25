import Link from "next/link";
import { deleteSponsor, saveSponsor } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";

export const instant = false;

export default async function SponsorsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event) return <p>The event database has not been seeded.</p>;
  const editing = query.edit === "new" ? null : event.sponsors.find((sponsor) => sponsor.id === query.edit);
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">Sponsors</h1>
        <Link href="/admin/sponsors?edit=new" className={buttonClass("primary")}>Add sponsor</Link>
      </div>
      <AdminStatus saved={query.saved} error={query.error} />
      <ul className="grid gap-3">
        {event.sponsors.map((sponsor) => (
          <li key={sponsor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
            <span>{sponsor.name} · {sponsor.tier} {sponsor.isSample ? "· Sample" : ""} {sponsor.active ? "" : "· Hidden"}</span>
            <span className="flex gap-3">
              <Link className="text-sm font-semibold text-electric-deep" href={`/admin/sponsors?edit=${sponsor.id}`}>Edit</Link>
              <form action={deleteSponsor}><input type="hidden" name="id" value={sponsor.id} /><button className="text-sm text-red-800">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
      {query.edit ? (
        <form action={saveSponsor} className="grid max-w-3xl gap-4 rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-navy">{editing ? "Edit sponsor" : "New sponsor"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className={labelClass}>Name<input className={inputClass} name="name" defaultValue={editing?.name ?? ""} required /></label>
          <label className={labelClass}>Tier<input className={inputClass} name="tier" defaultValue={editing?.tier ?? "Partner"} /></label>
          <label className={labelClass}>Website<input className={inputClass} name="website" defaultValue={editing?.website ?? ""} /></label>
          <label className={labelClass}>Logo path<input className={inputClass} name="logoUrl" defaultValue={editing?.logoUrl ?? ""} /></label>
          <label className={labelClass}>Or upload a logo<input className={inputClass} name="logo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label className={labelClass}>Display order<input className={inputClass} name="displayOrder" type="number" defaultValue={editing?.displayOrder ?? 0} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? true} /> Sample logo</label>
          <button className={buttonClass("primary", "w-fit")}>Save sponsor</button>
        </form>
      ) : null}
    </div>
  );
}
