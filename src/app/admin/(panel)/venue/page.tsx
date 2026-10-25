import { saveVenue } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";

export const instant = false;

const fields = [
  ["name", "Venue name"],
  ["streetAddress", "Street address"],
  ["city", "City"],
  ["country", "Country"],
  ["hoursLabel", "Event hours"],
  ["travelSummary", "Travel summary"],
  ["publicTransport", "Public transport"],
  ["parking", "Parking"],
  ["accessibility", "Accessibility"],
  ["accommodation", "Accommodation"],
  ["directionsUrl", "Directions URL"],
  ["mapEmbedUrl", "Map embed URL"],
] as const;

export default async function VenueAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event?.venue) return <p>The event database has not been seeded.</p>;
  const venue = event.venue;
  return (
    <form action={saveVenue} className="grid max-w-3xl gap-4">
      <h1 className="font-display text-4xl text-navy">Venue</h1>
      <p className="text-sm leading-6 text-slate">Leave this unconfirmed until the location is real. Do not add travel claims you have not verified.</p>
      <AdminStatus saved={query.saved} error={query.error} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirmed" defaultChecked={venue.confirmed} /> Venue is confirmed</label>
      {fields.map(([name, label]) => (
        <label key={name} className={labelClass}>
          {label}
          {name === "travelSummary" || name === "publicTransport" || name === "parking" || name === "accessibility" || name === "accommodation" ? (
            <textarea className={inputClass} name={name} rows={3} defaultValue={venue[name]} />
          ) : (
            <input className={inputClass} name={name} defaultValue={venue[name]} />
          )}
        </label>
      ))}
      <button className={buttonClass("primary", "w-fit")}>Save venue</button>
    </form>
  );
}
