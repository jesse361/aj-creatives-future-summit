import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { CURRENCIES } from "@/lib/constants";
import { inputClass, labelClass } from "@/lib/styles";
import { mediaConfigured } from "@/lib/uploads";
import { paystackConfigured } from "@/lib/paystack";
import { saveSettings } from "@/server/actions/admin-settings";

export const instant = false;

export default async function SettingsAdmin() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  const socials = Array.isArray(settings?.socialLinks) ? settings.socialLinks : [];
  const first = socials[0] && typeof socials[0] === "object" ? socials[0] as { label?: string; url?: string } : { label: "", url: "" };
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Settings</h1>
      <ul className="grid gap-1 text-sm text-ink-soft">
        <li>Payments: {paystackConfigured() ? "Paystack configured" : "Paystack not configured"}</li>
        <li>Email: {process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY ? "provider key present" : "not configured"}</li>
        <li>Media: {mediaConfigured() ? "Blob configured" : "Blob not configured"}</li>
        <li>Newsletter sync: {process.env.RESEND_AUDIENCE_ID ? "audience id present" : "stored locally only"}</li>
      </ul>
      <AdminForm action={saveSettings}>
        <label className={labelClass}>Brand name<input className={inputClass} name="brandName" defaultValue={settings?.brandName ?? "WHY US"} required /></label>
        <label className={labelClass}>Legal name<input className={inputClass} name="legalName" defaultValue={settings?.legalName ?? ""} required /></label>
        <label className={labelClass}>Tagline<input className={inputClass} name="tagline" defaultValue={settings?.tagline ?? ""} required /></label>
        <label className={labelClass}>Secondary tagline<input className={inputClass} name="secondaryTagline" defaultValue={settings?.secondaryTagline ?? ""} required /></label>
        <label className={labelClass}>Logo URL<input className={inputClass} name="logoUrl" defaultValue={settings?.logoUrl ?? ""} /></label>
        <label className={labelClass}>Contact email<input className={inputClass} name="contactEmail" defaultValue={settings?.contactEmail ?? ""} /></label>
        <label className={labelClass}>Contact phone<input className={inputClass} name="contactPhone" defaultValue={settings?.contactPhone ?? ""} /></label>
        <label className={labelClass}>Address<textarea className={inputClass} name="address" defaultValue={settings?.address ?? ""} /></label>
        <label className={labelClass}>Social label<input className={inputClass} name="socialLabel" defaultValue={first.label ?? ""} /></label>
        <label className={labelClass}>Social URL<input className={inputClass} name="socialUrl" defaultValue={first.url ?? ""} /></label>
        <label className={labelClass}>Currency<select className={inputClass} name="defaultCurrency" defaultValue={settings?.defaultCurrency ?? "GHS"}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="announcementEnabled" defaultChecked={settings?.announcementEnabled ?? false} /> Show announcement</label>
        <label className={labelClass}>Announcement<input className={inputClass} name="announcement" defaultValue={settings?.announcement ?? ""} /></label>
        <label className={labelClass}>Footer<textarea className={inputClass} name="footerContent" defaultValue={settings?.footerContent ?? ""} /></label>
        <label className={labelClass}>SEO title<input className={inputClass} name="seoTitle" defaultValue={settings?.seoTitle ?? ""} /></label>
        <label className={labelClass}>SEO description<textarea className={inputClass} name="seoDescription" defaultValue={settings?.seoDescription ?? ""} /></label>
        <label className={labelClass}>Payment hold minutes<input className={inputClass} type="number" name="registrationHoldMinutes" defaultValue={settings?.registrationHoldMinutes ?? 30} /></label>
      </AdminForm>
    </div>
  );
}
