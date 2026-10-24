import { deleteSession, saveSession } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { SESSION_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { toDateTimeLocalValue } from "@/lib/time";

export const metadata = { title: "Manage schedule" };

export default async function ScheduleAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const query = await searchParams;
  const event = await prisma.event.findFirst();
  const zone = event?.timezone || "UTC";
  const sessions = await prisma.session.findMany({ orderBy: { startAt: "asc" }, include: { speakers: true } });
  const speakers = await prisma.speaker.findMany({ orderBy: { name: "asc" } });
  const editing = sessions.find((session) => session.id === query.edit);

  return (
    <div>
      <h1 className="text-4xl">Schedule</h1>
      <p className="mt-2 text-sm text-muted">Times use the event timezone ({zone}). Overlapping sessions in the same room are rejected.</p>
      <AdminNotice saved={query.saved} error={query.error} />
      <ul className="mt-6 grid gap-3">
        {sessions.map((session) => (
          <li key={session.id} className="surface-card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{session.title}</p>
              <p className="text-sm text-muted">{session.category} · {session.published ? "Published" : "Hidden"}</p>
            </div>
            <a className="text-sm font-semibold text-action" href={`/admin/schedule?edit=${session.id}`}>Edit</a>
          </li>
        ))}
      </ul>
      <form action={saveSession} className="surface-card mt-8 grid gap-4 p-6">
        <h2 className="text-2xl">{editing ? "Edit session" : "Add a session"}</h2>
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <label className="field">Title<input name="title" defaultValue={editing?.title ?? ""} required /></label>
        <label className="field">Description<textarea name="description" defaultValue={editing?.description ?? ""} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Start<input type="datetime-local" name="startAt" defaultValue={editing ? toDateTimeLocalValue(editing.startAt, zone) : ""} required /></label>
          <label className="field">End<input type="datetime-local" name="endAt" defaultValue={editing ? toDateTimeLocalValue(editing.endAt, zone) : ""} required /></label>
        </div>
        <label className="field">Room<input name="room" defaultValue={editing?.room ?? ""} /></label>
        <label className="field">Category
          <select name="category" defaultValue={editing?.category ?? "Keynote"}>
            {SESSION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Speakers</legend>
          <div className="grid gap-2">
            {speakers.map((speaker) => (
              <label key={speaker.id} className="flex gap-2 text-sm">
                <input type="checkbox" name="speakerId" value={speaker.id} defaultChecked={editing?.speakers.some((link) => link.speakerId === speaker.id)} />
                {speaker.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">Display order<input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isBreak" defaultChecked={editing?.isBreak ?? false} /> This is a break</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> Published</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? false} /> Sample session</label>
        <button className="btn btn-primary w-fit">Save session</button>
      </form>
      {editing ? (
        <form action={deleteSession} className="mt-4">
          <input type="hidden" name="id" value={editing.id} />
          <button className="text-sm text-[#9f1239]">Delete this session</button>
        </form>
      ) : null}
    </div>
  );
}
