import Image from "next/image";
import { coverSrc } from "@/lib/format";

export function MediaFill({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const safe = coverSrc(src);
  if (safe.startsWith("https://")) {
    return (
      // Remote uploads are not on the Next image allowlist. A plain image keeps an owner-supplied URL from crashing the page.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={safe} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
    );
  }
  return <Image src={safe} alt={alt} fill priority={priority} sizes={sizes} className={className} />;
}

export function Portrait({ name, src, className = "" }: { name: string; src?: string | null; className?: string }) {
  const safe = src && (src.startsWith("/") || src.startsWith("https://")) ? src : "";
  return (
    <div className={`relative overflow-hidden bg-paper ${className}`}>
      {safe ? (
        <MediaFill src={safe} alt={`Portrait of ${name}`} sizes="240px" />
      ) : (
        <span className="grid h-full w-full place-items-center font-display">{name.slice(0, 1)}</span>
      )}
    </div>
  );
}
