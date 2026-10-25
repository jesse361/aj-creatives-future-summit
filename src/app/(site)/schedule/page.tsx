import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui";
import { ScheduleBoard } from "@/components/schedule-board";
import { getPublishedEvent } from "@/lib/event-data";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getPublishedEvent();
  const title = `Schedule · ${event?.name ?? "THE FUTURE SUMMIT 2027"} · AJ CREATIVES`;
  const description = "The summit agenda. Sample sessions are labeled until the organizer publishes a confirmed programme.";
  return { title, description, openGraph: { title, description } };
}

export default async function SchedulePage() {
  const event = await getPublishedEvent();
  if (!event) notFound();
  return (
    <>
      <PageIntro
        eyebrow="Agenda"
        title="Schedule"
        description="Sessions are listed in time order for each day. Breaks are visually distinct from presentations. Use the filters to focus on a day or category."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <ScheduleBoard
          sessions={event.sessions}
          timeZone={event.timezone}
          timezoneConfirmed={event.timezoneConfirmed}
          datesConfirmed={event.datesConfirmed}
        />
      </div>
    </>
  );
}
