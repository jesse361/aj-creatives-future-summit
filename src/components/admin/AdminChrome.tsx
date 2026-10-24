import Link from "next/link";
import { logoutAction } from "@/actions/auth";

const links = [
  ["Overview", "/admin"],
  ["Event", "/admin/event"],
  ["Speakers", "/admin/speakers"],
  ["Schedule", "/admin/schedule"],
  ["Tickets", "/admin/tickets"],
  ["Registrations", "/admin/registrations"],
  ["Sponsors", "/admin/sponsors"],
  ["Inquiries", "/admin/inquiries"],
  ["Settings", "/admin/settings"],
];

export function AdminNav() {
  return (
    <div className="mb-8 rounded-3xl bg-navy p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display tracking-[0.16em]">ORGANIZER</p>
        <form action={logoutAction}>
          <button className="text-sm text-mist hover:text-white">Sign out</button>
        </form>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto" aria-label="Administration">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="shrink-0 rounded-full px-3 py-2 text-sm hover:bg-white/10">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function AdminNotice({ saved, error }: { saved?: string; error?: string }) {
  if (!saved && !error) return null;
  return (
    <p role="status" className={`mb-4 rounded-2xl px-4 py-3 text-sm ${error ? "bg-red-50 text-[#9f1239]" : "bg-emerald-50 text-emerald-900"}`}>
      {error || saved}
    </p>
  );
}
