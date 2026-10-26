import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { canExportAttendees } from "@/lib/permissions";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || !canExportAttendees(admin.role)) return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const registrations = await prisma.registration.findMany({
    where: {
      ...(eventId ? { eventId } : {}),
      ...(status ? { registrationStatus: status as "CONFIRMED" | "PENDING_PAYMENT" | "CANCELLED" | "EXPIRED" | "FAILED" } : {}),
    },
    include: { event: true, items: true, payment: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const csv = toCsv(
    ["reference", "event", "name", "email", "phone", "organization", "status", "total", "currency", "payment", "created"],
    registrations.map((registration) => [
      registration.reference,
      registration.event.title,
      registration.attendeeName,
      registration.attendeeEmail,
      registration.attendeePhone,
      registration.organization,
      registration.registrationStatus,
      (registration.totalAmount / 100).toFixed(2),
      registration.currency,
      registration.payment?.paymentStatus ?? "",
      registration.createdAt.toISOString(),
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=registrations.csv",
    },
  });
}
