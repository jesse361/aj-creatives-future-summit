import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin-form";
import { EventFields } from "@/components/admin/event-fields";
import { prisma } from "@/lib/db";
import { saveEvent } from "@/server/actions/admin-content";

export const instant = false;

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, speakers, sponsors] = await Promise.all([
    prisma.event.findUnique({ where: { id }, include: { speakers: true, sponsors: true } }),
    prisma.speaker.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.sponsor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);
  if (!event) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-4xl text-navy">Edit event</h1>
      <AdminForm action={saveEvent}>
        <EventFields event={event} speakers={speakers} sponsors={sponsors} />
      </AdminForm>
    </div>
  );
}
