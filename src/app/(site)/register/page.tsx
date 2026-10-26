import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { RegistrationForm, type EventOffer } from "@/components/registration-form";
import { PageHero } from "@/components/ui";
import { paystackConfigured } from "@/lib/paystack";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Register", description: "Register for a published WHY US event." };

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ event?: string; ticket?: string }> }) {
  return (
    <>
      <PageHero eyebrow="Registration" title="Reserve your place" description="Choose a ticket, tell us who is attending, and review the price before anything is saved." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Suspense fallback={<p>Loading tickets…</p>}>
          <RegisterBody searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function RegisterBody({ searchParams }: { searchParams: Promise<{ event?: string; ticket?: string }> }) {
  await connection();
  const params = await searchParams;
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", registrationOpen: true, endDate: { gte: now } },
    orderBy: { startDate: "asc" },
    include: { ticketTypes: { where: { status: "ACTIVE" }, orderBy: { priceMinor: "asc" } } },
  });
  const offers: EventOffer[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    isDemonstration: event.isDemonstration,
    tickets: event.ticketTypes.map((ticket) => ({
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      priceMinor: ticket.priceMinor,
      currency: ticket.currency,
      benefits: ticket.benefits,
      remaining: Math.max(ticket.capacity - ticket.sold - ticket.reserved, 0),
      minimumQuantity: ticket.minimumQuantity,
      maximumQuantity: ticket.maximumQuantity,
      isDemonstration: ticket.isDemonstration,
    })),
  }));
  const initialEvent = offers.find((event) => event.slug === params.event);
  return (
    <RegistrationForm
      events={offers}
      initialEventId={initialEvent?.id ?? ""}
      initialTicketId={params.ticket ?? ""}
      paymentConfigured={paystackConfigured()}
    />
  );
}
