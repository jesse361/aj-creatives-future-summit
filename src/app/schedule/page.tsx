import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/schedule/ScheduleBoard";
import { getSiteData } from "@/lib/event-data";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Agenda for The Future Summit 2027. Sample sessions are labeled until the organizer publishes the confirmed program.",
};

export default async function SchedulePage() {
  const data = await getSiteData();
  const sessions = data?.sessions ?? [];
  return (
    <main className="page-wrap py-16">
      <p className="text-xs tracking-[0.22em] text-action">AGENDA</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Schedule</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Sessions are listed in start-time order for each day. Breaks are visually quieter than presentations.
        {data && !data.event.datesConfirmed ? " The current dates are a demonstration and are not confirmed." : ""}
      </p>
      {sessions.some((session) => session.isSample) ? (
        <p className="mt-4 rounded-2xl bg-lavender/25 px-4 py-3 text-sm text-navy">
          Sample agenda. These sessions are placeholder content for the website demonstration.
        </p>
      ) : null}
      <div className="mt-8">
        <ScheduleBoard sessions={sessions} timezone={data?.event.timezone ?? "UTC"} />
      </div>
    </main>
  );
}
