import { deleteSponsor, saveSponsor } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { prisma } from "@/lib/db";

export const metadata = { title: "Manage sponsors" };

export default async function SponsorsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const query = await searchParams;
  const sponsors = await prisma.sponsor.findMany({ orderBy: { sortOrder: "asc" } });
  const editing = sponsors.find((sponsor) => sponsor.id === query.edit);
  return (
    <div>
      <h1 className="text-4xl">Sponsors</h1>
      <p className="mt-2 text-sm text-muted">Use real logos only when the partner has supplied them. Keep sample records marked and inactive if you do not want them on the public site.</p>
      <AdminNotice saved={query.saved} error={query.error} />
      <ul className="mt-6 grid gap-3">
        {sponsors.map((sponsor) => (
          <li key={sponsor.id} className="surface-card flex items-center justify-between p-4">
            <span>{sponsor.name} · {sponsor.tier}{sponsor.active ? "" : " · Hidden"}{sponsor.isSample ? " · Sample" : ""}</span>
            <a className="text-sm font-semibold text-action" href={`/admin/sponsors?edit=${sponsor.id}`}>Edit</a>
          </li>
        ))}
      </ul>
      <form action={saveSponsor} className="surface-card mt-8 grid gap-4 p-6">
        <h2 className="text-2xl">{editing ? "Edit sponsor" : "Add a sponsor"}</h2>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <label className="field">Name<input name="name" defaultValue={editing?.name ?? ""} required /></label>
        <label className="field">Logo path or URL<input name="logo" defaultValue={editing?.logo ?? ""} /></label>
        <label className="field">Website<input name="website" defaultValue={editing?.website ?? ""} /></label>
        <label className="field">Tier<input name="tier" defaultValue={editing?.tier ?? "Partner"} /></label>
        <label className="field">Display order<input type="number" name="sortOrder" defaultValue={editing?.sortOrder ?? sponsors.length} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? false} /> Active</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? false} /> Sample placeholder</label>
        <button className="btn btn-primary w-fit">Save sponsor</button>
      </form>
      {editing ? (
        <form action={deleteSponsor} className="mt-4">
          <input type="hidden" name="id" value={editing.id} />
          <button className="text-sm text-[#9f1239]">Delete this sponsor</button>
        </form>
      ) : null}
    </div>
  );
}
