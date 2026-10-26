import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { inputClass, labelClass } from "@/lib/styles";
import { deleteSpeaker, saveSpeaker } from "@/server/actions/admin-content";

export const instant = false;

export default async function SpeakersAdmin({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const [speakers, current] = await Promise.all([
    prisma.speaker.findMany({ orderBy: { name: "asc" } }),
    id ? prisma.speaker.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  const links = Array.isArray(current?.socialLinks) ? current.socialLinks : [];
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Speakers</h1>
      <ul className="grid gap-2 text-sm">
        {speakers.map((speaker) => (
          <li key={speaker.id}><a className="text-electric" href={`/admin/speakers?id=${speaker.id}`}>{speaker.name}</a> · {speaker.status}</li>
        ))}
      </ul>
      <AdminForm action={saveSpeaker} submitLabel={current ? "Update speaker" : "Create speaker"}>
        {current ? <input type="hidden" name="id" value={current.id} /> : null}
        <label className={labelClass}>Name<input className={inputClass} name="name" required defaultValue={current?.name ?? ""} /></label>
        <label className={labelClass}>Slug<input className={inputClass} name="slug" required defaultValue={current?.slug ?? ""} /></label>
        <label className={labelClass}>Title<input className={inputClass} name="professionalTitle" required defaultValue={current?.professionalTitle ?? ""} /></label>
        <label className={labelClass}>Organization<input className={inputClass} name="organization" defaultValue={current?.organization ?? ""} /></label>
        <label className={labelClass}>Biography<textarea className={`${inputClass} min-h-32`} name="biography" required defaultValue={current?.biography ?? ""} /></label>
        <label className={labelClass}>Portrait URL<input className={inputClass} name="portrait" defaultValue={current?.portrait ?? ""} /></label>
        <label className={labelClass}>Portrait alt<input className={inputClass} name="portraitAlt" defaultValue={current?.portraitAlt ?? ""} /></label>
        <label className={labelClass}>Expertise, one per line<textarea className={inputClass} name="expertise" defaultValue={current?.expertise.join("\n") ?? ""} /></label>
        <label className={labelClass}>Social label<input className={inputClass} name="socialLabel" defaultValue={typeof links[0] === "object" && links[0] && "label" in links[0] ? String(links[0].label) : ""} /></label>
        <label className={labelClass}>Social URL<input className={inputClass} name="socialUrl" defaultValue={typeof links[0] === "object" && links[0] && "url" in links[0] ? String(links[0].url) : ""} /></label>
        <label className={labelClass}>Status<select className={inputClass} name="status" defaultValue={current?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={current?.featured ?? false} /> Featured</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isDemonstration" defaultChecked={current?.isDemonstration ?? false} /> Demonstration profile</label>
      </AdminForm>
      {current ? (
        <form action={deleteSpeaker}>
          <input type="hidden" name="id" value={current.id} />
          <button className="text-sm text-red-800" type="submit">Remove speaker</button>
        </form>
      ) : null}
    </div>
  );
}
