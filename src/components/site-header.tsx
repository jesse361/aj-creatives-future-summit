"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/lib/styles";

const links = [
  { href: "/", label: "Home" },
  { href: "/speakers", label: "Speakers" },
  { href: "/schedule", label: "Schedule" },
  { href: "/tickets", label: "Tickets" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuPath(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-sm font-semibold tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender">
          AJ CREATIVES
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current(link.href) ? "page" : undefined}
              className={`text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender ${current(link.href) ? "text-white" : "text-mist hover:text-white"}`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/tickets" className={buttonClass("primary")}>
            Register Now
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setMenuPath(open ? null : pathname)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {open ? (
        <nav id={menuId} className="border-t border-white/10 px-4 py-4 lg:hidden" aria-label="Mobile">
          <div className="grid gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current(link.href) ? "page" : undefined}
                className="rounded-2xl px-3 py-3 text-base font-medium hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/tickets" className={buttonClass("primary", "mt-2")}>
              Register Now
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
