import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-wrap py-24">
      <p className="text-xs tracking-[0.22em] text-action">404</p>
      <h1 className="mt-3 text-5xl">That page is not on the program</h1>
      <p className="mt-4 text-muted">The link may be out of date. Head back to the summit homepage.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Home
      </Link>
    </main>
  );
}
