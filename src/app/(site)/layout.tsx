import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/settings";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <Suspense fallback={<div className="h-16 bg-navy" />}>
        <SiteFrame />
      </Suspense>
      <main id="content" className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <FooterFrame />
      </Suspense>
    </>
  );
}

async function SiteFrame() {
  const settings = await getSettings();
  return (
    <>
      {settings.announcementEnabled ? (
        <p className="bg-gold px-4 py-2 text-center text-sm text-navy">{settings.announcement}</p>
      ) : null}
      <SiteHeader brand={settings.brandName} logoUrl={settings.logoUrl} />
    </>
  );
}

async function FooterFrame() {
  const settings = await getSettings();
  return <SiteFooter settings={settings} />;
}
