"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { buttonClass } from "@/lib/styles";

const links = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/speakers", label: "Speakers" },
  { href: "/schedule", label: "Schedule" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ brand, logoUrl }: { brand: string; logoUrl: string }) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const [searchOpen, setSearchOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const items = panel ? [...panel.querySelectorAll<HTMLElement>("a, button, input")] : [];
    items[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPath(null);
        buttonRef.current?.focus();
      }
      if (event.key !== "Tab" || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <span className="grid h-8 w-8 place-items-center border border-gold text-[10px] font-semibold tracking-[0.14em] text-gold">WU</span>
          )}
          <span className="font-display text-lg tracking-[0.18em]">{brand}</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current(link.href) ? "page" : undefined} className={`text-xs uppercase tracking-[0.16em] ${current(link.href) ? "text-gold" : "text-white/80 hover:text-white"}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {searchOpen ? (
            <form action="/events" className="flex items-center border border-white/20">
              <label className="sr-only" htmlFor="site-search">
                Search events
              </label>
              <input id="site-search" name="q" placeholder="Search events" className="w-40 bg-transparent px-3 py-2 text-sm outline-none" />
              <button className="px-3 text-gold" type="submit">
                Go
              </button>
            </form>
          ) : (
            <button type="button" className="grid h-11 w-11 place-items-center text-white" aria-label="Search events" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
            </button>
          )}
          <Link href="/events" className={buttonClass("gold")}>
            Explore Events
          </Link>
        </div>
        <button ref={buttonRef} type="button" className="grid h-11 w-11 place-items-center lg:hidden" aria-expanded={open} aria-controls={menuId} onClick={() => setMenuPath(open ? null : pathname)}>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? (
        <div ref={panelRef} id={menuId} className="border-t border-white/10 bg-navy px-4 py-6 lg:hidden">
          <nav className="grid gap-2" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="border-b border-white/10 py-3 text-sm uppercase tracking-[0.16em]">
                {link.label}
              </Link>
            ))}
          </nav>
          <form action="/events" className="mt-5 grid gap-3">
            <label className="text-xs uppercase tracking-[0.16em] text-mist" htmlFor="mobile-search">
              Search
            </label>
            <input id="mobile-search" name="q" className="border border-white/20 bg-transparent px-3 py-3" />
            <button className={buttonClass("secondary")} type="submit">
              Search events
            </button>
          </form>
          <Link href="/events" className={`${buttonClass("gold")} mt-4 w-full`}>
            Explore Events
          </Link>
        </div>
      ) : null}
    </header>
  );
}
