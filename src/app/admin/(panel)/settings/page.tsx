import { saveSettings } from "@/server/actions/admin";
import { getAdminEvent } from "@/lib/admin-data";
import { AdminStatus } from "@/components/admin-nav";
import { defaultHighlights, defaultWhyAttend } from "@/lib/defaults";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import type { Highlight, SocialLink, WhyItem } from "@/lib/types";

export const instant = false;

function read<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [event, query] = await Promise.all([getAdminEvent(), searchParams]);
  if (!event?.settings) return <p>The event database has not been seeded.</p>;
  const settings = event.settings;
  const why = read<WhyItem[]>(settings.whyAttend, defaultWhyAttend);
  const highlights = read<Highlight[]>(settings.highlights, defaultHighlights);
  const social = read<SocialLink[]>(settings.socialLinks, []);
  return (
    <form action={saveSettings} className="grid max-w-3xl gap-4">
      <h1 className="font-display text-4xl text-navy">Settings and homepage</h1>
      <AdminStatus saved={query.saved} error={query.error} />
      <label className={labelClass}>Organizer<input className={inputClass} name="organizerName" defaultValue={settings.organizerName} /></label>
      <label className={labelClass}>Public email<input className={inputClass} name="contactEmail" defaultValue={settings.contactEmail} /></label>
      <label className={labelClass}>Public phone<input className={inputClass} name="contactPhone" defaultValue={settings.contactPhone} /></label>
      <label className={labelClass}>Currency<input className={inputClass} name="currency" defaultValue={settings.currency} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="currencyConfirmed" defaultChecked={settings.currencyConfirmed} /> Currency is confirmed</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="registrationOpen" defaultChecked={settings.registrationOpen} /> Registration is open</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="phoneRequired" defaultChecked={settings.phoneRequired} /> Phone number is required</label>
      <label className={labelClass}>Final call to action<input className={inputClass} name="ctaHeadline" defaultValue={settings.ctaHeadline} /></label>
      <label className={labelClass}>Call to action description<textarea className={inputClass} name="ctaDescription" rows={2} defaultValue={settings.ctaDescription} /></label>
      <label className={labelClass}>Next event label<input className={inputClass} name="nextEventLabel" defaultValue={settings.nextEventLabel} /></label>
      <label className={labelClass}>Next event URL<input className={inputClass} name="nextEventUrl" defaultValue={settings.nextEventUrl} /></label>
      <fieldset className="grid gap-3">
        <legend className="font-semibold text-navy">Why attend</legend>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="grid gap-2">
            <input className={inputClass} name={`whyTitle${index}`} defaultValue={why[index]?.title ?? ""} placeholder="Title" />
            <textarea className={inputClass} name={`whyDescription${index}`} defaultValue={why[index]?.description ?? ""} rows={2} placeholder="Description" />
          </div>
        ))}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="font-semibold text-navy">Highlights</legend>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="grid gap-2">
            <input className={inputClass} name={`highlightTitle${index}`} defaultValue={highlights[index]?.title ?? ""} placeholder="Title" />
            <textarea className={inputClass} name={`highlightDescription${index}`} defaultValue={highlights[index]?.description ?? ""} rows={2} />
            <input className={inputClass} name={`highlightImage${index}`} defaultValue={highlights[index]?.image ?? ""} placeholder="/images/workshop.jpg" />
          </div>
        ))}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="font-semibold text-navy">Social links</legend>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-2">
            <input className={inputClass} name={`socialLabel${index}`} defaultValue={social[index]?.label ?? ""} placeholder="Label" />
            <input className={inputClass} name={`socialUrl${index}`} defaultValue={social[index]?.url ?? ""} placeholder="https://" />
          </div>
        ))}
      </fieldset>
      <label className={labelClass}>Privacy notice<textarea className={inputClass} name="privacyNotice" rows={8} defaultValue={settings.privacyNotice} /></label>
      <label className={labelClass}>Registration terms<textarea className={inputClass} name="termsText" rows={8} defaultValue={settings.termsText} /></label>
      <button className={buttonClass("primary", "w-fit")}>Save settings</button>
    </form>
  );
}
