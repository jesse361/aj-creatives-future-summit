import { deleteSpeaker, saveSpeaker } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/security";

export const metadata = { title: "Manage speakers" };

export default async function SpeakersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const query = await searchParams;
  const speakers = await prisma.speaker.findMany({ orderBy: { sortOrder: "asc" } });
  const editing = speakers.find((speaker) => speaker.id === query.edit);
  const social = parseJson<Record<string, string>>(editing?.socialLinks, {});
  const expertise = parseJson<string[]>(editing?.expertise, []).join(", ");

  return (
    <div>
      <h1 className="text-4xl">Speakers</h1>
      <AdminNotice saved={query.saved} error={query.error} />
      <ul className="mt-6 grid gap-3">
        {speakers.map((speaker) => (
          <li key={speaker.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{speaker.name}</p>
              <p className="text-sm text-muted">{speaker.published ? "Published" : "Hidden"}{speaker.isSample ? " · Sample" : ""}</p>
            </div>
            <a className="text-sm font-semibold text-action" href={`/admin/speakers?edit=${speaker.id}`}>Edit</a>
          </li>
        ))}
      </ul>
      <form action={saveSpeaker} className="surface-card mt-8 grid gap-4 p-6">
        <h2 className="text-2xl">{editing ? `Edit ${editing.name}` : "Add a speaker"}</h2>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <label className="field">Full name<input name="name" defaultValue={editing?.name ?? ""} required /></label>
        <label className="field">Job title<input name="jobTitle" defaultValue={editing?.jobTitle ?? ""} /></label>
        <label className="field">Organization<input name="organization" defaultValue={editing?.organization ?? ""} /></label>
        <label className="field">Biography<textarea name="bio" defaultValue={editing?.bio ?? ""} /></label>
        <label className="field">Expertise, comma separated<input name="expertise" defaultValue={expertise} /></label>
        <label className="field">Session title<input name="sessionTitle" defaultValue={editing?.sessionTitle ?? ""} /></label>
        <label className="field">Portrait URL<input name="portrait" defaultValue={editing?.portrait ?? ""} /></label>
        <label className="field">Or upload a portrait<input type="file" name="portraitFile" accept="image/jpeg,image/png,image/webp" /></label>
        <label className="field">LinkedIn<input name="linkedin" defaultValue={social.linkedin ?? ""} /></label>
        <label className="field">Instagram<input name="instagram" defaultValue={social.instagram ?? ""} /></label>
        <label className="field">X<input name="x" defaultValue={social.x ?? ""} /></label>
        <label className="field">Website<input name="website" defaultValue={social.website ?? ""} /></label>
        <label className="field">Display order<input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? speakers.length} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={editing?.featured ?? false} /> Featured on the homepage</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> Published</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? false} /> Sample profile, not a confirmed speaker</label>
        <button className="btn btn-primary w-fit">Save speaker</button>
      </form>
      {editing ? (
        <form action={deleteSpeaker} className="mt-4">
          <input type="hidden" name="id" value={editing.id} />
          <button className="text-sm text-[#9f1239]">Delete this speaker</button>
        </form>
      ) : null}
    </div>
  );
}
