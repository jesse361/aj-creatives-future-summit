import "server-only";
import { prisma } from "@/lib/db";
import type { AdminIdentity } from "@/lib/types";

export async function writeAudit(actor: Pick<AdminIdentity, "id"> | null, action: string, entity: string, entityId: string, summary: string) {
  await prisma.auditLog.create({
    data: {
      actorId: actor?.id,
      action,
      entity,
      entityId,
      summary: summary.slice(0, 300),
    },
  });
}
