import Link from "next/link";
import { deleteSpeaker, saveSpeaker } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";

export const instant = false;

function asLines(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed.join(", ");
    if (Array.isArray(parsed)) return parsed.map((item) => `${(item as { label: string }).label} | ${(item as { url: string }).url}`).join("\n");
  } catch {
    return "";
  }
  return "";
}

export default async function SpeakersAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event) return <p>The event database has not been seeded.</p>;
  const editing = query.edit === "new" ? null : event.speakers.find((speaker) => speaker.id === query.edit);
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">Speakers</h1>
        <Link href="/admin/speakers?edit=new" className={buttonClass("primary")}>Add speaker</Link>
      </div>
      <AdminStatus saved={query.saved} error={query.error} />
      <ul className="grid gap-3">
        {event.speakers.map((speaker) => (
          <li key={speaker.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
            <span>{speaker.name} {speaker.isSample ? "· Sample" : ""} {speaker.published ? "" : "· Hidden"}</span>
            <span className="flex gap-3">
              <Link className="text-sm font-semibold text-electric-deep" href={`/admin/speakers?edit=${speaker.id}`}>Edit</Link>
              <form action={deleteSpeaker}><input type="hidden" name="id" value={speaker.id} /><button className="text-sm text-red-800">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
      {query.edit ? (
        <form action={saveSpeaker} className="grid max-w-3xl gap-4 rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-navy">{editing ? "Edit speaker" : "New speaker"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className={labelClass}>Name<input className={inputClass} name="name" defaultValue={editing?.name ?? ""} required /></label>
          <label className={labelClass}>Slug<input className={inputClass} name="slug" defaultValue={editing?.slug ?? ""} /></label>
          <label className={labelClass}>Title<input className={inputClass} name="jobTitle" defaultValue={editing?.jobTitle ?? ""} required /></label>
          <label className={labelClass}>Organization<input className={inputClass} name="organization" defaultValue={editing?.organization ?? ""} required /></label>
          <label className={labelClass}>Biography<textarea className={inputClass} name="biography" rows={6} defaultValue={editing?.biography ?? ""} required /></label>
          <label className={labelClass}>Expertise, comma separated<input className={inputClass} name="expertise" defaultValue={editing ? asLines(editing.expertise) : ""} /></label>
          <label className={labelClass}>Portrait path<input className={inputClass} name="portraitUrl" defaultValue={editing?.portraitUrl ?? ""} /></label>
          <label className={labelClass}>Or upload a JPEG, PNG, or WebP<input className={inputClass} name="portrait" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label className={labelClass}>Social links, one per line as Label | https://…<textarea className={inputClass} name="social" rows={3} defaultValue={editing ? asLines(editing.socialLinks) : ""} /></label>
          <label className={labelClass}>Display order<input className={inputClass} name="displayOrder" type="number" defaultValue={editing?.displayOrder ?? 0} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false} /> Published</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={editing?.featured ?? false} /> Featured on the homepage</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? true} /> Sample profile</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="portraitIsSample" defaultChecked={editing?.portraitIsSample ?? true} /> Portrait is a placeholder</label>
          <button className={buttonClass("primary", "w-fit")}>Save speaker</button>
        </form>
      ) : null}
    </div>
  );
}
