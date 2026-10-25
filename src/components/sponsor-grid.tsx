import Image from "next/image";
import type { PublicSponsor } from "@/lib/types";
import { isSafeImageSrc } from "@/lib/safe-url";

export function SponsorGrid({ sponsors }: { sponsors: PublicSponsor[] }) {
  if (sponsors.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line bg-white p-8">Sponsor announcements coming soon.</p>;
  }
  const samples = sponsors.some((sponsor) => sponsor.isSample);
  const tiers = [...new Set(sponsors.map((sponsor) => sponsor.tier))];

  return (
    <div>
      {samples ? (
        <p className="mb-6 rounded-2xl bg-lavender/15 px-4 py-3 text-sm leading-6 text-navy">
          Sample logos for layout demonstration. These are not real sponsor partnerships.
        </p>
      ) : null}
      <div className="space-y-8">
        {tiers.map((tier) => (
          <div key={tier}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-deep">{tier}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {sponsors
                .filter((sponsor) => sponsor.tier === tier)
                .map((sponsor) => {
                  const logo = sponsor.logoUrl.startsWith("/") && isSafeImageSrc(sponsor.logoUrl) ? (
                    <Image
                      src={sponsor.logoUrl}
                      alt={`${sponsor.name}${sponsor.isSample ? " sample logo" : " logo"}`}
                      width={240}
                      height={80}
                      className="h-16 w-auto object-contain"
                      unoptimized={sponsor.logoUrl.endsWith(".svg")}
                    />
                  ) : (
                    <span className="font-display text-lg text-navy">{sponsor.name}</span>
                  );
                  return (
                    <li key={sponsor.id} className="grid min-h-28 place-items-center rounded-3xl border border-line bg-white px-4 py-5">
                      {sponsor.website ? (
                        <a href={sponsor.website} rel="noreferrer" className="w-full text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric-deep">
                          {logo}
                        </a>
                      ) : (
                        logo
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
