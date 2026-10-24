import { saveEvent } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { EVENT_FORMATS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { EVENT_SLUG } from "@/lib/constants";
import { parseJson } from "@/lib/security";
import { toDateTimeLocalValue } from "@/lib/time";

type Item = { title: string; text: string; image?: string };

export const metadata = { title: "Edit event" };

export default async function EventAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const event = await prisma.event.findUnique({ where: { slug: EVENT_SLUG } });
  if (!event) return <p>The event record is missing. Run the database seed.</p>;
  const why = parseJson<Item[]>(event.whyAttend, []);
  const highlights = parseJson<Item[]>(event.highlights, []);
  const zone = event.timezone || "UTC";

  return (
    <div>
      <h1 className="text-4xl">Event</h1>
      <p className="mt-2 text-sm text-muted">Leave dates and venue unconfirmed until AJ Creatives has the real details. The public site labels anything that is not confirmed.</p>
      <AdminNotice saved={query.saved} error={query.error} />
      <form action={saveEvent} className="mt-6 grid gap-4">
        <label className="field">Event name<input name="name" defaultValue={event.name} required /></label>
        <label className="field">Tagline<input name="tagline" defaultValue={event.tagline} /></label>
        <label className="field">Description<textarea name="description" defaultValue={event.description} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Publication
            <select name="status" defaultValue={event.status}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
          <label className="field">Format
            <select name="format" defaultValue={event.format}>
              {EVENT_FORMATS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <label className="field">Timezone<input name="timezone" defaultValue={zone} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Start<input type="datetime-local" name="startAt" defaultValue={event.startAt ? toDateTimeLocalValue(event.startAt, zone) : ""} /></label>
          <label className="field">End<input type="datetime-local" name="endAt" defaultValue={event.endAt ? toDateTimeLocalValue(event.endAt, zone) : ""} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="datesConfirmed" defaultChecked={event.datesConfirmed} /> Date is confirmed</label>
        <label className="field">Hero image path<input name="heroImage" defaultValue={event.heroImage ?? ""} /></label>
        <h2 className="mt-4 text-2xl">Venue and travel</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Venue name<input name="venueName" defaultValue={event.venueName ?? ""} /></label>
          <label className="field">Street address<input name="venueAddress" defaultValue={event.venueAddress ?? ""} /></label>
          <label className="field">City<input name="venueCity" defaultValue={event.venueCity ?? ""} /></label>
          <label className="field">Country<input name="venueCountry" defaultValue={event.venueCountry ?? ""} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="venueConfirmed" defaultChecked={event.venueConfirmed} /> Venue is confirmed</label>
        <label className="field">Hours<label className="sr-only">Hours</label><input name="hoursLabel" defaultValue={event.hoursLabel ?? ""} /></label>
        <label className="field">Travel summary<textarea name="travelSummary" defaultValue={event.travelSummary ?? ""} /></label>
        <label className="field">Public transport<textarea name="transitInfo" defaultValue={event.transitInfo ?? ""} /></label>
        <label className="field">Parking<textarea name="parkingInfo" defaultValue={event.parkingInfo ?? ""} /></label>
        <label className="field">Accessibility<textarea name="accessibilityInfo" defaultValue={event.accessibilityInfo ?? ""} /></label>
        <label className="field">Accommodation<textarea name="accommodationInfo" defaultValue={event.accommodationInfo ?? ""} /></label>
        <label className="field">Directions URL<input name="directionsUrl" defaultValue={event.directionsUrl ?? ""} /></label>
        <label className="field">Map embed URL<input name="mapEmbedUrl" defaultValue={event.mapEmbedUrl ?? ""} /></label>
        <h2 className="mt-4 text-2xl">Homepage</h2>
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="grid gap-3 md:grid-cols-2">
            <label className="field">Why attend title {index + 1}<input name={`whyTitle${index}`} defaultValue={why[index]?.title ?? ""} /></label>
            <label className="field">Why attend text {index + 1}<input name={`whyText${index}`} defaultValue={why[index]?.text ?? ""} /></label>
          </div>
        ))}
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="grid gap-3">
            <label className="field">Highlight title {index + 1}<input name={`highlightTitle${index}`} defaultValue={highlights[index]?.title ?? ""} /></label>
            <label className="field">Highlight text {index + 1}<input name={`highlightText${index}`} defaultValue={highlights[index]?.text ?? ""} /></label>
            <label className="field">Highlight image {index + 1}<input name={`highlightImage${index}`} defaultValue={highlights[index]?.image ?? ""} /></label>
          </div>
        ))}
        <label className="field">Closing headline<input name="ctaHeadline" defaultValue={event.ctaHeadline} /></label>
        <label className="field">Closing text<textarea name="ctaText" defaultValue={event.ctaText} /></label>
        <button className="btn btn-primary w-fit">Save event</button>
      </form>
    </div>
  );
}
