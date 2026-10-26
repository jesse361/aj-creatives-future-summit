import type { AdminIdentity } from "@/lib/types";

export function canEditContent(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN" || role === "EDITOR";
}

export function canManageCommerce(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageSettings(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}

export function canExportAttendees(role: AdminIdentity["role"]) {
  return role === "OWNER" || role === "ADMIN";
}
