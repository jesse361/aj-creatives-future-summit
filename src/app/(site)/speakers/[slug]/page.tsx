import type { Metadata } from "next";
import { SpeakerProfilePage } from "@/app/(site)/speakers/page";
import { getPublishedEvent } from "@/lib/event-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent();
  const speaker = event?.speakers.find((item) => item.slug === slug);
  const title = speaker ? `${speaker.name} · ${event?.name ?? "Speakers"} · AJ CREATIVES` : "Speaker · AJ CREATIVES";
  const description = speaker?.isSample
    ? `Sample speaker profile for ${speaker.name}. This is demonstration content, not a confirmed appearance.`
    : speaker?.biography.slice(0, 160) || "Speaker profile";
  return { title, description, openGraph: { title, description } };
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <SpeakerProfilePage params={params} />;
}
