import Link from "next/link";
import { buttonClass } from "@/lib/styles";

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: "primary" | "secondary" | "light" | "ghost";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "light" | "line";
}) {
  const tones = {
    blue: "bg-electric/10 text-electric-deep",
    light: "bg-white/10 text-white",
    line: "bg-paper text-slate",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
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
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-lavender" : "text-electric-deep"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl ${light ? "text-white" : "text-navy"}`}>{title}</h2>
      {description ? <p className={`mt-4 text-base leading-7 ${light ? "text-mist" : "text-slate"}`}>{description}</p> : null}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lavender">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">{description}</p>
      </div>
    </section>
  );
}
