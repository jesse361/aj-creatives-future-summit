import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-electric">404</p>
      <h1 className="mt-3 font-display text-5xl text-navy">That page is not available.</h1>
      <p className="mt-4 text-ink-soft">The event, speaker, or registration may be unpublished or the address may be wrong.</p>
      <Link className="mt-6 inline-block text-sm uppercase tracking-[0.16em] text-electric" href="/events">Explore events</Link>
    </section>
  );
}
