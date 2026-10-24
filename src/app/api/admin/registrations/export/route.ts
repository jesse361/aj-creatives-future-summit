import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function GET() {
  await requireAdmin();
  const rows = await prisma.registration.findMany({
    include: { ticketType: true },
    orderBy: { createdAt: "desc" },
  });
  const header = ["reference", "name", "email", "phone", "organization", "jobTitle", "ticket", "quantity", "status", "paymentStatus", "dietaryNotes", "createdAt"];
  const body = rows.map((row) =>
    [
      row.reference,
      row.attendeeName,
      row.email,
      row.phone,
      row.organization,
      row.jobTitle,
      row.ticketType.name,
      row.quantity,
      row.status,
      row.paymentStatus,
      row.dietaryNotes,
      row.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [header.join(","), ...body].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"registrations.csv\"",
      "Cache-Control": "no-store",
    },
  });
}
