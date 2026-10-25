import "server-only";
import { prisma } from "@/lib/db";

export function getAdminEvent() {
  return prisma.event.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      venue: true,
      settings: true,
      speakers: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
      sessions: {
        orderBy: [{ startAt: "asc" }, { displayOrder: "asc" }],
        include: { speakers: true },
      },
      ticketTypes: { orderBy: { displayOrder: "asc" } },
      sponsors: { orderBy: { displayOrder: "asc" } },
    },
  });
}
