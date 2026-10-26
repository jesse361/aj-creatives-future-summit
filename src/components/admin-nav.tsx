"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/actions/auth";

const links = [
  ["/admin", "Overview"],
  ["/admin/events", "Events"],
  ["/admin/speakers", "Speakers"],
  ["/admin/schedule", "Schedule"],
  ["/admin/tickets", "Tickets"],
  ["/admin/registrations", "Registrations"],
  ["/admin/payments", "Payments"],
  ["/admin/sponsors", "Sponsors"],
  ["/admin/inquiries", "Inquiries"],
  ["/admin/media", "Media"],
  ["/admin/pages", "Pages"],
  ["/admin/newsletter", "Newsletter"],
  ["/admin/settings", "Settings"],
  ["/admin/profile", "Profile"],
] as const;

export function AdminNav({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();
  return (
    <aside className="bg-navy text-white lg:min-h-screen">
      <div className="px-5 py-6">
        <p className="text-xs tracking-[0.18em] text-gold">WHY US</p>
        <p className="font-display text-xl">Admin</p>
        <p className="mt-2 text-xs text-mist">{email}</p>
        <p className="text-xs uppercase tracking-[0.14em] text-mist">{role}</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:grid lg:px-3" aria-label="Admin">
        {links.map(([href, label]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`px-3 py-2 text-sm whitespace-nowrap ${active ? "bg-white text-navy" : "text-mist hover:bg-white/10 hover:text-white"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="px-4 py-4">
        <button type="submit" className="text-sm text-mist hover:text-white">Log out</button>
      </form>
    </aside>
  );
}
