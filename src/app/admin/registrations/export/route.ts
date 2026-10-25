import { getCurrentAdmin } from "@/lib/auth";
import { getAdminEvent } from "@/lib/admin-data";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { registrationWhere } from "@/lib/registration";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const event = await getAdminEvent();
  if (!event) return new Response("Event not found", { status: 404 });
  const url = new URL(request.url);
  const registrations = await prisma.registration.findMany({
    where: registrationWhere(event.id, url.searchParams.get("q") ?? "", url.searchParams.get("status") ?? "ALL"),
    include: { ticketType: true },
    orderBy: { createdAt: "desc" },
  });
  const csv = toCsv(
    ["Reference", "Name", "Email", "Phone", "Organization", "Role", "Ticket", "Quantity", "Amount", "Currency", "Status", "Payment", "Notes", "Created"],
    registrations.map((registration) => [
      registration.reference,
      registration.attendeeName,
      registration.email,
      registration.phone,
      registration.organization,
      registration.jobTitle,
      registration.ticketType.name,
      registration.quantity,
      (registration.amountCents / 100).toFixed(2),
      registration.currency,
      registration.status,
      registration.paymentStatus,
      registration.dietaryNotes,
      registration.createdAt.toISOString(),
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"registrations.csv\"",
      "Cache-Control": "no-store",
    },
  });
}
