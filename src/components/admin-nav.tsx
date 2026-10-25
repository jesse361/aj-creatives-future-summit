"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/actions/auth";

const links = [
  ["/admin", "Overview"],
  ["/admin/event", "Event"],
  ["/admin/venue", "Venue"],
  ["/admin/settings", "Settings"],
  ["/admin/speakers", "Speakers"],
  ["/admin/schedule", "Schedule"],
  ["/admin/tickets", "Tickets"],
  ["/admin/registrations", "Registrations"],
  ["/admin/sponsors", "Sponsors"],
  ["/admin/inquiries", "Inquiries"],
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <aside className="bg-navy text-white lg:min-h-screen">
      <div className="px-5 py-6">
        <p className="text-xs tracking-[0.18em] text-lavender">AJ CREATIVES</p>
        <p className="font-display text-xl">Summit admin</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:grid lg:px-3" aria-label="Admin">
        {links.map(([href, label]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-3 py-2 text-sm whitespace-nowrap ${active ? "bg-white text-navy" : "text-mist hover:bg-white/10 hover:text-white"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="px-4 py-4">
        <button type="submit" className="text-sm text-mist hover:text-white">
          Log out
        </button>
        <p className="mt-3 text-xs text-mist">{email}</p>
      </form>
    </aside>
  );
}

export function AdminStatus({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>;
  if (saved) return <p role="status" className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Saved.</p>;
  return null;
}
