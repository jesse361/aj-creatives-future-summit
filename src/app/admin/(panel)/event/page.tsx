import { saveEvent } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import { utcToZonedInput } from "@/lib/time";

export const instant = false;

export default async function EventAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event || !event.settings) return <p>The event database has not been seeded.</p>;
  return (
    <form action={saveEvent} className="grid max-w-3xl gap-4">
      <h1 className="font-display text-4xl text-navy">Event</h1>
      <AdminStatus saved={query.saved} error={query.error} />
      <label className={labelClass}>Name<input className={inputClass} name="name" defaultValue={event.name} required /></label>
      <label className={labelClass}>Tagline<input className={inputClass} name="tagline" defaultValue={event.tagline} required /></label>
      <label className={labelClass}>Description<textarea className={inputClass} name="description" rows={4} defaultValue={event.description} required /></label>
      <label className={labelClass}>Status
        <select className={inputClass} name="status" defaultValue={event.status}>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </label>
      <label className={labelClass}>Hero image path<input className={inputClass} name="heroImageUrl" defaultValue={event.heroImageUrl} /></label>
      <label className={labelClass}>Eyebrow<input className={inputClass} name="heroEyebrow" defaultValue={event.settings.heroEyebrow} /></label>
      <label className={labelClass}>Hero description<textarea className={inputClass} name="heroDescription" rows={3} defaultValue={event.settings.heroDescription} /></label>
      <label className={labelClass}>Timezone<input className={inputClass} name="timezone" defaultValue={event.timezone} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="timezoneConfirmed" defaultChecked={event.timezoneConfirmed} /> Timezone is confirmed</label>
      <label className={labelClass}>Start<input className={inputClass} type="datetime-local" name="startAt" defaultValue={event.startAt ? utcToZonedInput(event.startAt.toISOString(), event.timezone) : ""} /></label>
      <label className={labelClass}>End<input className={inputClass} type="datetime-local" name="endAt" defaultValue={event.endAt ? utcToZonedInput(event.endAt.toISOString(), event.timezone) : ""} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="datesConfirmed" defaultChecked={event.datesConfirmed} /> Date is confirmed</label>
      <label className={labelClass}>Format
        <select className={inputClass} name="format" defaultValue={event.format ?? ""}>
          <option value="">Not set</option>
          <option value="IN_PERSON">In person</option>
          <option value="VIRTUAL">Virtual</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="formatConfirmed" defaultChecked={event.formatConfirmed} /> Format is confirmed</label>
      <button className={buttonClass("primary", "w-fit")}>Save event</button>
    </form>
  );
}
