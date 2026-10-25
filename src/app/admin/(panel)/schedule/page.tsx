import Link from "next/link";
import { deleteSession, saveSession } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { SESSION_CATEGORIES } from "@/lib/constants";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import { utcToZonedInput } from "@/lib/time";

export const instant = false;

export default async function ScheduleAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event) return <p>The event database has not been seeded.</p>;
  const editing = query.edit === "new" ? null : event.sessions.find((session) => session.id === query.edit);
  const selected = new Set(editing?.speakers.map((link) => link.speakerId) ?? []);
  const moderator = editing?.speakers.find((link) => link.role === "MODERATOR")?.speakerId ?? "";
  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl text-navy">Schedule</h1>
        <Link href="/admin/schedule?edit=new" className={buttonClass("primary")}>Add session</Link>
      </div>
      <AdminStatus saved={query.saved} error={query.error} />
      <p className="text-sm text-slate">Times use the event timezone ({event.timezone}). Overlapping sessions in the same room are rejected.</p>
      <ul className="grid gap-3">
        {event.sessions.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
            <span>{utcToZonedInput(session.startAt.toISOString(), event.timezone).replace("T", " ")} · {session.title}</span>
            <span className="flex gap-3">
              <Link className="text-sm font-semibold text-electric-deep" href={`/admin/schedule?edit=${session.id}`}>Edit</Link>
              <form action={deleteSession}><input type="hidden" name="id" value={session.id} /><button className="text-sm text-red-800">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
      {query.edit ? (
        <form action={saveSession} className="grid max-w-3xl gap-4 rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl text-navy">{editing ? "Edit session" : "New session"}</h2>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <label className={labelClass}>Title<input className={inputClass} name="title" defaultValue={editing?.title ?? ""} required /></label>
          <label className={labelClass}>Description<textarea className={inputClass} name="description" rows={4} defaultValue={editing?.description ?? ""} /></label>
          <label className={labelClass}>Start<input className={inputClass} type="datetime-local" name="startAt" defaultValue={editing ? utcToZonedInput(editing.startAt.toISOString(), event.timezone) : ""} required /></label>
          <label className={labelClass}>End<input className={inputClass} type="datetime-local" name="endAt" defaultValue={editing ? utcToZonedInput(editing.endAt.toISOString(), event.timezone) : ""} required /></label>
          <label className={labelClass}>Room or location<input className={inputClass} name="room" defaultValue={editing?.room ?? ""} /></label>
          <label className={labelClass}>Category
            <select className={inputClass} name="category" defaultValue={editing?.category ?? "Keynote"}>
              {SESSION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className={labelClass}>People</legend>
            <div className="mt-2 grid gap-2">
              {event.speakers.map((speaker) => (
                <label key={speaker.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="speakerId" value={speaker.id} defaultChecked={selected.has(speaker.id)} />
                  {speaker.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={labelClass}>Moderator
            <select className={inputClass} name="moderatorId" defaultValue={moderator}>
              <option value="">None</option>
              {event.speakers.map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Display order<input className={inputClass} name="displayOrder" type="number" defaultValue={editing?.displayOrder ?? 0} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isBreak" defaultChecked={editing?.isBreak ?? false} /> This is a break</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> Published</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={editing?.isSample ?? true} /> Sample session</label>
          <button className={buttonClass("primary", "w-fit")}>Save session</button>
        </form>
      ) : null}
    </div>
  );
}
