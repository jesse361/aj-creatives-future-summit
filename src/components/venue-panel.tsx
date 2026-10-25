import type { PublicEvent } from "@/lib/types";
import { formatDateRange } from "@/lib/time";
import { isSafeEmbedUrl } from "@/lib/safe-url";

function Detail({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-electric-deep">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap leading-7">{body}</p>
    </div>
  );
}

export function VenuePanel({ event }: { event: PublicEvent }) {
  const venue = event.venue;
  if (!venue.confirmed) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white p-6 sm:p-8">
        <h3 className="font-display text-2xl text-navy">Venue details coming soon</h3>
        <p className="mt-3 max-w-2xl leading-7 text-slate">
          The venue name, address, travel information, parking, accessibility notes, and accommodation suggestions will appear here after they are confirmed. This site does not list directions, travel times, or hotel partnerships that have not been supplied.
        </p>
      </div>
    );
  }

  const place = [venue.streetAddress, venue.city, venue.country].filter(Boolean).join(", ");
  const when = [event.datesConfirmed ? formatDateRange(event.startAt, event.endAt, event.timezone) : "", venue.hoursLabel].filter(Boolean).join(" · ");
  const map = isSafeEmbedUrl(venue.mapEmbedUrl) ? venue.mapEmbedUrl : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl bg-white p-6 sm:p-8">
        <h3 className="font-display text-3xl text-navy">{venue.name}</h3>
        {place ? <p className="mt-3 text-lg text-slate">{place}</p> : null}
        <div className="mt-6 grid gap-5">
          <Detail title="Date and hours" body={when || "Event hours have not been added."} />
          <Detail title="Getting there" body={venue.travelSummary} />
          <Detail title="Public transport" body={venue.publicTransport} />
          <Detail title="Parking" body={venue.parking} />
          <Detail title="Accessibility" body={venue.accessibility} />
          <Detail title="Nearby accommodation" body={venue.accommodation} />
        </div>
        {venue.directionsUrl ? (
          <a className="mt-6 inline-flex font-semibold text-electric-deep" href={venue.directionsUrl} rel="noreferrer">
            Open directions
          </a>
        ) : null}
      </div>
      {map ? (
        <iframe title={`Map of ${venue.name}`} src={map} className="min-h-80 w-full rounded-3xl border-0 bg-white" loading="lazy" />
      ) : (
        <div className="grid min-h-80 place-items-center rounded-3xl bg-white p-8 text-center text-slate">A map will appear when a confirmed embed link is saved.</div>
      )}
    </div>
  );
}
