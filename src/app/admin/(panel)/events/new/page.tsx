import { AdminForm } from "@/components/admin-form";
import { EventFields } from "@/components/admin/event-fields";
import { prisma } from "@/lib/db";
import { saveEvent } from "@/server/actions/admin-content";

export const instant = false;

export default async function NewEventPage() {
  const [speakers, sponsors] = await Promise.all([
    prisma.speaker.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.sponsor.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);
  return (
    <div>
      <h1 className="mb-6 font-display text-4xl text-navy">New event</h1>
      <AdminForm action={saveEvent} submitLabel="Create event">
        <EventFields speakers={speakers} sponsors={sponsors} />
      </AdminForm>
    </div>
  );
}
