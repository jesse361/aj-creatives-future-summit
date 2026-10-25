import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-navy">Page not found</h1>
      <p className="mt-4 leading-7">That page is not part of the summit site.</p>
      <Link href="/" className="mt-6 inline-flex font-semibold text-electric-deep">
        Back to the homepage
      </Link>
    </div>
  );
}
