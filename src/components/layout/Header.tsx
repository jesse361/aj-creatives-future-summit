"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="theme-dark sticky top-0 z-40 border-b border-white/10 bg-navy/90 text-white backdrop-blur-md">
      <div className="page-wrap flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="font-display text-sm font-semibold tracking-[0.2em]">
          AJ CREATIVES
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-mist lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={active ? "text-white" : "hover:text-white"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/tickets" className="btn btn-primary hidden sm:inline-flex">
            Register Now
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-nav" className="border-t border-white/10 bg-navy px-5 py-4 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-xl px-3 py-3 text-base hover:bg-white/5"
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/tickets" className="btn btn-primary mt-3 w-full">
            Register Now
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
