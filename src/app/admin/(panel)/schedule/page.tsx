import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { SESSION_CATEGORIES } from "@/lib/constants";
import { inputClass, labelClass } from "@/lib/styles";
import { utcToZonedInput } from "@/lib/time";
import { deleteSession, saveSession } from "@/server/actions/admin-content";

export const instant = false;

export default async function ScheduleAdmin({ searchParams }: { searchParams: Promise<{ eventId?: string; id?: string }> }) {
  const params = await searchParams;
  const events = await prisma.event.findMany({ orderBy: { startDate: "desc" } });
  const eventId = params.eventId || events[0]?.id || "";
  const [sessions, speakers, current] = await Promise.all([
    eventId ? prisma.session.findMany({ where: { eventId }, orderBy: [{ startTime: "asc" }, { displayOrder: "asc" }], include: { speakers: true } }) : Promise.resolve([]),
    prisma.speaker.findMany({ orderBy: { name: "asc" } }),
    params.id ? prisma.session.findUnique({ where: { id: params.id }, include: { speakers: true } }) : Promise.resolve(null),
  ]);
  const event = events.find((item) => item.id === (current?.eventId || eventId));
  const zone = event?.timezone || "Africa/Accra";
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Schedule</h1>
      <form className="flex gap-3" action="/admin/schedule">
        <select className={inputClass} name="eventId" defaultValue={eventId}>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <button className="bg-navy px-4 text-xs uppercase tracking-[0.14em] text-white">Show</button>
      </form>
      <ul className="grid gap-2 text-sm">
        {sessions.map((session) => (
          <li key={session.id} className="flex justify-between gap-3 border-b border-line py-2">
            <span>{session.title} · {session.status}</span>
            <span className="flex gap-3">
              <a className="text-electric" href={`/admin/schedule?eventId=${session.eventId}&id=${session.id}`}>Edit</a>
            </span>
          </li>
        ))}
      </ul>
      <AdminForm action={saveSession} submitLabel={current ? "Update session" : "Create session"}>
        {current ? <input type="hidden" name="id" value={current.id} /> : null}
        <input type="hidden" name="eventId" value={current?.eventId || eventId} />
        <label className={labelClass}>Title<input className={inputClass} name="title" required defaultValue={current?.title ?? ""} /></label>
        <label className={labelClass}>Description<textarea className={inputClass} name="description" defaultValue={current?.description ?? ""} /></label>
        <label className={labelClass}>Starts<input className={inputClass} type="datetime-local" name="startTime" required defaultValue={current ? utcToZonedInput(current.startTime.toISOString(), zone) : ""} /></label>
        <label className={labelClass}>Ends<input className={inputClass} type="datetime-local" name="endTime" required defaultValue={current ? utcToZonedInput(current.endTime.toISOString(), zone) : ""} /></label>
        <label className={labelClass}>Room<input className={inputClass} name="room" defaultValue={current?.room ?? ""} /></label>
        <label className={labelClass}>Category<select className={inputClass} name="category" defaultValue={current?.category ?? "Keynote"}>{SESSION_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className={labelClass}>Order<input className={inputClass} type="number" name="displayOrder" defaultValue={current?.displayOrder ?? 0} /></label>
        <label className={labelClass}>Status<select className={inputClass} name="status" defaultValue={current?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
        <fieldset className="grid gap-2">
          <legend className={labelClass}>Speakers</legend>
          {speakers.map((speaker) => (
            <label key={speaker.id} className="flex gap-2 text-sm">
              <input type="checkbox" name="sessionSpeakerId" value={speaker.id} defaultChecked={current?.speakers.some((link) => link.speakerId === speaker.id)} />
              {speaker.name}
            </label>
          ))}
        </fieldset>
      </AdminForm>
      {current ? <form action={deleteSession}><input type="hidden" name="id" value={current.id} /><button className="text-sm text-red-800">Delete session</button></form> : null}
    </div>
  );
}
