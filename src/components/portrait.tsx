import Image from "next/image";
import { isSafeImageSrc } from "@/lib/safe-url";

export function Portrait({ src, name, sample }: { src: string; name: string; sample: boolean }) {
  const alt = sample
    ? `Sample illustrated portrait placeholder for ${name}. Not a photograph of a confirmed speaker.`
    : `Portrait of ${name}`;
  if (src && isSafeImageSrc(src) && src.startsWith("/")) {
    return <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 280px, 100vw" unoptimized={src.endsWith(".svg")} />;
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div role="img" aria-label={alt} className="grid h-full w-full place-items-center bg-ink font-display text-4xl text-white">
      {initials}
    </div>
  );
}
