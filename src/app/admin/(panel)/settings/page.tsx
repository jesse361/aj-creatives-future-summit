import { saveSettings } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/security";

export const metadata = { title: "Settings" };

export default async function SettingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const settings = await prisma.eventSettings.findUnique({ where: { id: "default" } });
  if (!settings) return <p>Settings are missing. Run the database seed.</p>;
  const social = parseJson<Record<string, string>>(settings.socialLinks, {});
  return (
    <div>
      <h1 className="text-4xl">Settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Do not invent a public email or phone. Leave them blank until AJ Creatives provides them. Currency can be changed to GHS if the event is confirmed in Ghana.</p>
      <AdminNotice saved={query.saved} error={query.error} />
      <form action={saveSettings} className="mt-6 grid gap-4">
        <label className="field">Organizer name<input name="organizerName" defaultValue={settings.organizerName} /></label>
        <label className="field">Public contact email<input name="contactEmail" type="email" defaultValue={settings.contactEmail ?? ""} /></label>
        <label className="field">Public phone<input name="contactPhone" defaultValue={settings.contactPhone ?? ""} /></label>
        <label className="field">Website<input name="websiteUrl" defaultValue={settings.websiteUrl ?? ""} /></label>
        <label className="field">Currency<input name="currency" defaultValue={settings.currency} /></label>
        <label className="field">Maximum tickets per registration<input type="number" name="maxTicketsPerOrder" defaultValue={settings.maxTicketsPerOrder} /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="registrationOpen" defaultChecked={settings.registrationOpen} /> Registration is open</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="requirePhone" defaultChecked={settings.requirePhone} /> Phone number is required</label>
        <label className="field">LinkedIn<input name="linkedin" defaultValue={social.linkedin ?? ""} /></label>
        <label className="field">Instagram<input name="instagram" defaultValue={social.instagram ?? ""} /></label>
        <label className="field">X<input name="x" defaultValue={social.x ?? ""} /></label>
        <label className="field">YouTube<input name="youtube" defaultValue={social.youtube ?? ""} /></label>
        <label className="field">Social website<input name="website" defaultValue={social.website ?? ""} /></label>
        <label className="field">Privacy notice<textarea name="privacyNotice" defaultValue={settings.privacyNotice} /></label>
        <label className="field">Registration terms<textarea name="termsText" defaultValue={settings.termsText} /></label>
        <button className="btn btn-primary w-fit">Save settings</button>
      </form>
    </div>
  );
}
