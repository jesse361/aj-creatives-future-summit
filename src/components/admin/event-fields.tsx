import { EVENT_CATEGORIES } from "@/lib/constants";
import { inputClass, labelClass } from "@/lib/styles";
import { utcToZonedInput } from "@/lib/time";

type EventRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  coverImage: string;
  coverAlt: string;
  gallery: string[];
  startDate: Date;
  endDate: Date;
  timezone: string;
  venueName: string;
  venueAddress: string;
  city: string;
  country: string;
  eventFormat: string;
  onlineDetails: string;
  travelInfo: string;
  accessibilityInfo: string;
  status: string;
  registrationOpen: boolean;
  isDemonstration: boolean;
  faqs: unknown;
  speakers: { speakerId: string }[];
  sponsors: { sponsorId: string }[];
};

function faqs(value: unknown) {
  if (!Array.isArray(value)) return [] as { question: string; answer: string }[];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || !("question" in item)) return [];
    return [{ question: String(item.question), answer: "answer" in item ? String(item.answer) : "" }];
  });
}

export function EventFields({
  event,
  speakers,
  sponsors,
}: {
  event?: EventRecord;
  speakers: { id: string; name: string }[];
  sponsors: { id: string; name: string; status: string }[];
}) {
  const zone = event?.timezone || "Africa/Accra";
  const pairs = faqs(event?.faqs);
  return (
    <>
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <label className={labelClass}>Title<input className={inputClass} name="title" required defaultValue={event?.title ?? ""} /></label>
      <label className={labelClass}>Slug<input className={inputClass} name="slug" required defaultValue={event?.slug ?? ""} /></label>
      <label className={labelClass}>Short description<textarea className={inputClass} name="shortDescription" required defaultValue={event?.shortDescription ?? ""} /></label>
      <label className={labelClass}>Full description<textarea className={`${inputClass} min-h-40`} name="fullDescription" required defaultValue={event?.fullDescription ?? ""} /></label>
      <label className={labelClass}>
        Category
        <input className={inputClass} name="category" list="categories" required defaultValue={event?.category ?? ""} />
        <datalist id="categories">{EVENT_CATEGORIES.map((item) => <option key={item} value={item} />)}</datalist>
      </label>
      <label className={labelClass}>Cover image URL<input className={inputClass} name="coverImage" defaultValue={event?.coverImage ?? ""} /></label>
      <label className={labelClass}>Cover alt text<input className={inputClass} name="coverAlt" defaultValue={event?.coverAlt ?? ""} /></label>
      <label className={labelClass}>Gallery URLs, one per line<textarea className={inputClass} name="gallery" defaultValue={event?.gallery.join("\n") ?? ""} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Starts<input className={inputClass} type="datetime-local" name="startDate" required defaultValue={event ? utcToZonedInput(event.startDate.toISOString(), zone) : ""} /></label>
        <label className={labelClass}>Ends<input className={inputClass} type="datetime-local" name="endDate" required defaultValue={event ? utcToZonedInput(event.endDate.toISOString(), zone) : ""} /></label>
      </div>
      <label className={labelClass}>Timezone<input className={inputClass} name="timezone" defaultValue={zone} /></label>
      <label className={labelClass}>
        Format
        <select className={inputClass} name="eventFormat" defaultValue={event?.eventFormat ?? "IN_PERSON"}>
          <option value="IN_PERSON">In person</option>
          <option value="ONLINE">Online</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </label>
      <label className={labelClass}>
        Status
        <select className={inputClass} name="status" defaultValue={event?.status ?? "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>
      <label className={labelClass}>Venue<input className={inputClass} name="venueName" defaultValue={event?.venueName ?? ""} /></label>
      <label className={labelClass}>Address<input className={inputClass} name="venueAddress" defaultValue={event?.venueAddress ?? ""} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>City<input className={inputClass} name="city" defaultValue={event?.city ?? ""} /></label>
        <label className={labelClass}>Country<input className={inputClass} name="country" defaultValue={event?.country ?? ""} /></label>
      </div>
      <label className={labelClass}>Online details<textarea className={inputClass} name="onlineDetails" defaultValue={event?.onlineDetails ?? ""} /></label>
      <label className={labelClass}>Travel<textarea className={inputClass} name="travelInfo" defaultValue={event?.travelInfo ?? ""} /></label>
      <label className={labelClass}>Accessibility<textarea className={inputClass} name="accessibilityInfo" defaultValue={event?.accessibilityInfo ?? ""} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="registrationOpen" defaultChecked={event?.registrationOpen ?? true} /> Registration open</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDemonstration" defaultChecked={event?.isDemonstration ?? false} /> Mark as demonstration content</label>
      <fieldset className="grid gap-3">
        <legend className={labelClass}>Speakers</legend>
        {speakers.map((speaker) => (
          <label key={speaker.id} className="flex gap-2 text-sm">
            <input type="checkbox" name="speakerId" value={speaker.id} defaultChecked={event?.speakers.some((link) => link.speakerId === speaker.id)} />
            {speaker.name}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className={labelClass}>Sponsors on this event</legend>
        {sponsors.map((sponsor) => (
          <label key={sponsor.id} className="flex gap-2 text-sm">
            <input type="checkbox" name="sponsorId" value={sponsor.id} defaultChecked={event?.sponsors.some((link) => link.sponsorId === sponsor.id)} />
            {sponsor.name} ({sponsor.status})
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className={labelClass}>Event questions</legend>
        {[...pairs, { question: "", answer: "" }].map((pair, index) => (
          <div key={`${pair.question}-${index}`} className="grid gap-2">
            <input className={inputClass} name="faqQuestion" placeholder="Question" defaultValue={pair.question} />
            <textarea className={inputClass} name="faqAnswer" placeholder="Answer" defaultValue={pair.answer} />
          </div>
        ))}
      </fieldset>
    </>
  );
}
