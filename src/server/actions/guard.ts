import "server-only";
import { getCurrentAdmin } from "@/lib/auth";
import { canEditContent, canExportAttendees, canManageCommerce, canManageSettings } from "@/lib/permissions";
import type { AdminIdentity } from "@/lib/types";

export async function guard(kind: "content" | "commerce" | "settings" | "export") {
  const admin = await getCurrentAdmin();
  if (!admin) return { admin: null, error: "You need to sign in again." as const };
  const allowed =
    kind === "content"
      ? canEditContent(admin.role)
      : kind === "commerce"
        ? canManageCommerce(admin.role)
        : kind === "export"
          ? canExportAttendees(admin.role)
          : canManageSettings(admin.role);
  if (!allowed) return { admin, error: "You do not have permission for that change." as const };
  return { admin: admin as AdminIdentity, error: null };
}
