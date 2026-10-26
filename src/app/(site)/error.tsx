"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-navy">Something went wrong.</h1>
      <p className="mt-4 text-ink-soft">The page could not be loaded. You can try again.</p>
      <button className="mt-6 min-h-11 bg-navy px-5 text-xs uppercase tracking-[0.16em] text-white" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
