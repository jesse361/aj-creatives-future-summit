"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-navy">Something went wrong</h1>
      <p className="mt-4 leading-7">The page could not be loaded. Try again in a moment.</p>
      <button type="button" className="mt-6 rounded-full bg-electric-deep px-5 py-3 font-semibold text-white" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
