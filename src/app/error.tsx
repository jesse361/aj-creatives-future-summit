"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-wrap py-24">
      <h1 className="text-4xl">This page could not be loaded</h1>
      <p className="mt-4 text-muted">Try again. If it keeps happening, the organizer can check the server logs.</p>
      <button type="button" className="btn btn-primary mt-8" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
