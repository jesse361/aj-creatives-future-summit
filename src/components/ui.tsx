import Link from "next/link";
import { buttonClass } from "@/lib/styles";

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: "primary" | "secondary" | "light" | "ghost" | "gold";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "blue" | "line" | "light" }) {
  const tones = {
    gold: "border border-gold/50 text-gold",
    blue: "border border-electric/30 text-electric",
    line: "border border-line text-ink-soft",
    light: "border border-white/20 text-white",
  };
  return <span className={`inline-flex px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tones[tone]}`}>{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-gold" : "text-electric"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl ${light ? "text-white" : "text-navy"}`}>{title}</h2>
      {description ? <p className={`mt-4 text-base leading-7 ${light ? "text-mist" : "text-ink-soft"}`}>{description}</p> : null}
    </div>
  );
}

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-medium tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">{description}</p>
      </div>
    </section>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <div className="border border-dashed border-line bg-white px-6 py-14 text-center">
      <h2 className="font-display text-2xl text-navy">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink-soft">{body}</p>
      {action ? (
        <div className="mt-6">
          <ButtonLink href={action.href}>{action.label}</ButtonLink>
        </div>
      ) : null}
    </div>
  );
}

export function DemoNote({ children = "Demonstration" }: { children?: React.ReactNode }) {
  return <Badge tone="line">{children}</Badge>;
}
