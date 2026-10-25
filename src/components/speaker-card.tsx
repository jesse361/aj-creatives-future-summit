import Link from "next/link";
import { Badge } from "@/components/ui";
import { Portrait } from "@/components/portrait";
import type { PublicSpeaker } from "@/lib/types";

export function SpeakerCard({ speaker }: { speaker: PublicSpeaker }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <div className="relative aspect-[4/5] bg-ink">
        <Portrait src={speaker.portraitUrl} name={speaker.name} sample={speaker.isSample || speaker.portraitIsSample} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          {speaker.isSample ? <Badge>Sample profile</Badge> : null}
          {speaker.categories.slice(0, 1).map((category) => (
            <Badge key={category} tone="line">
              {category}
            </Badge>
          ))}
        </div>
        <h3 className="mt-3 font-display text-2xl text-navy">{speaker.name}</h3>
        <p className="mt-1 text-sm font-medium text-electric-deep">
          {speaker.jobTitle}
          {speaker.organization ? ` · ${speaker.organization}` : ""}
        </p>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate">{speaker.biography}</p>
        {speaker.sessionTitles[0] ? <p className="mt-3 text-sm font-medium text-navy">Session: {speaker.sessionTitles[0]}</p> : null}
        <Link
          href={`/speakers/${speaker.slug}`}
          className="mt-5 inline-flex text-sm font-semibold text-electric-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric-deep"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
