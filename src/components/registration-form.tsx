"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerAction } from "@/server/actions/public";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import { formatMoney } from "@/lib/money";
import type { FormState } from "@/lib/types";

export type TicketOffer = {
  id: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  benefits: string[];
  remaining: number;
  minimumQuantity: number;
  maximumQuantity: number;
  isDemonstration: boolean;
};

export type EventOffer = {
  id: string;
  title: string;
  slug: string;
  isDemonstration: boolean;
  tickets: TicketOffer[];
};

const schema = z.object({
  eventId: z.string().min(1, "Choose an event."),
  ticketTypeId: z.string().min(1, "Choose a ticket."),
  quantity: z.coerce.number().int().min(1),
  fullName: z.string().trim().min(2, "Enter the attendee name."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(30),
  organization: z.string().trim().max(160),
  termsAccepted: z.boolean().refine((value) => value, { message: "Agree to the terms to continue." }),
});

const initial: FormState = { ok: false, message: "" };

export function RegistrationForm({ events, initialEventId = "", initialTicketId = "", paymentConfigured }: { events: EventOffer[]; initialEventId?: string; initialTicketId?: string; paymentConfigured: boolean }) {
  const [step, setStep] = useState(0);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(registerAction, initial);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: initialEventId,
      ticketTypeId: initialTicketId,
      quantity: 1,
      fullName: "",
      email: "",
      phone: "",
      organization: "",
      termsAccepted: false,
    },
  });
  // React Hook Form's watch() is the supported way to follow these fields.
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch cannot be memoized by the React compiler
  const eventId = form.watch("eventId");
  const ticketTypeId = form.watch("ticketTypeId");
  const quantity = Number(form.watch("quantity") || 1);
  const event = events.find((item) => item.id === eventId);
  const ticket = event?.tickets.find((item) => item.id === ticketTypeId);
  const max = ticket ? Math.min(ticket.maximumQuantity, ticket.remaining) : 1;
  const review = useMemo(() => {
    if (!ticket) return null;
    return { unit: formatMoney(ticket.priceMinor, ticket.currency), total: formatMoney(ticket.priceMinor * quantity, ticket.currency) };
  }, [ticket, quantity]);

  const next = async () => {
    const fields = step === 0 ? (["eventId", "ticketTypeId", "quantity"] as const) : (["fullName", "email", "phone", "organization", "termsAccepted"] as const);
    const valid = await form.trigger(fields);
    if (valid) setStep((value) => value + 1);
  };

  return (
    <form action={action} className="grid gap-6 border border-line bg-white p-6 sm:p-8" noValidate>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="ticketTypeId" value={ticketTypeId} />
      <input type="hidden" name="quantity" value={quantity} />
      <input className="hp-field" tabIndex={-1} autoComplete="off" name="companyWebsite" aria-hidden="true" />
      <ol className="flex gap-4 text-[11px] uppercase tracking-[0.16em] text-mist">
        {["Ticket", "Details", "Review"].map((label, index) => (
          <li key={label} className={index === step ? "text-electric" : undefined} aria-current={index === step ? "step" : undefined}>
            0{index + 1} {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="grid gap-4">
          <label className={labelClass}>
            Event
            <select className={inputClass} {...form.register("eventId")} onChange={(eventChange) => { form.setValue("eventId", eventChange.target.value); form.setValue("ticketTypeId", ""); }}>
              <option value="">Select an event</option>
              {events.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.isDemonstration ? " (demonstration)" : ""}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-3">
            <legend className={labelClass}>Ticket</legend>
            {(event?.tickets ?? []).map((item) => (
              <label key={item.id} className="grid gap-1 border border-line px-4 py-3">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium">
                    <input type="radio" value={item.id} disabled={item.remaining < item.minimumQuantity} {...form.register("ticketTypeId")} />
                    {item.name}
                  </span>
                  <span>{item.priceMinor === 0 ? "Free" : formatMoney(item.priceMinor, item.currency)}</span>
                </span>
                <span className="text-sm text-ink-soft">{item.description}</span>
                <span className="text-xs uppercase tracking-[0.14em] text-mist">{item.remaining} remaining{item.isDemonstration ? " · demonstration price" : ""}</span>
              </label>
            ))}
            {event && event.tickets.length === 0 ? <p className="text-sm text-ink-soft">No tickets are on sale for this event.</p> : null}
          </fieldset>
          <label className={labelClass}>
            Quantity
            <input className={inputClass} type="number" min={ticket?.minimumQuantity ?? 1} max={Math.max(max, 1)} {...form.register("quantity", { valueAsNumber: true })} />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <label className={labelClass}>
            Full name
            <input className={inputClass} autoComplete="name" {...form.register("fullName")} />
          </label>
          <label className={labelClass}>
            Email
            <input className={inputClass} type="email" autoComplete="email" {...form.register("email")} />
          </label>
          <label className={labelClass}>
            Phone <span className="font-normal text-mist">(optional)</span>
            <input className={inputClass} autoComplete="tel" {...form.register("phone")} />
          </label>
          <label className={labelClass}>
            Organization <span className="font-normal text-mist">(optional)</span>
            <input className={inputClass} {...form.register("organization")} />
          </label>
          <label className="flex items-start gap-2 text-sm leading-6">
            <input type="checkbox" className="mt-1" {...form.register("termsAccepted")} />
            I agree to the <a className="underline" href="/terms">terms</a> and <a className="underline" href="/privacy">privacy notice</a>.
          </label>
        </div>
      ) : null}

      {step === 2 && event && ticket && review ? (
        <div className="grid gap-3 text-sm leading-6">
          <p className="font-display text-2xl text-navy">{event.title}</p>
          <p>{ticket.name} × {quantity}</p>
          <p>Unit price {review.unit}</p>
          <p className="text-lg">Total {review.total}</p>
          <p>{form.watch("fullName")} · {form.watch("email")}</p>
          {ticket.priceMinor > 0 && !paymentConfigured ? (
            <p className="bg-amber-50 px-3 py-3 text-amber-950">Paid checkout is not configured. Submitting will not confirm this ticket or take payment.</p>
          ) : null}
          {ticket.isDemonstration || event.isDemonstration ? <p className="text-ink-soft">This is demonstration inventory, not a confirmed public event.</p> : null}
          <input type="hidden" name="fullName" value={form.watch("fullName")} />
          <input type="hidden" name="email" value={form.watch("email")} />
          <input type="hidden" name="phone" value={form.watch("phone")} />
          <input type="hidden" name="organization" value={form.watch("organization")} />
          {form.watch("termsAccepted") ? <input type="hidden" name="termsAccepted" value="true" /> : null}
        </div>
      ) : null}

      {Object.values(form.formState.errors).map((item) => (
        <p key={item.message} className="text-sm text-red-800">{item.message}</p>
      ))}
      {state.message ? <p role="alert" className="bg-red-50 px-3 py-3 text-sm text-red-900">{state.message}</p> : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button type="button" className={buttonClass("ghost")} onClick={() => setStep((value) => value - 1)}>
            Back
          </button>
        ) : null}
        {step < 2 ? (
          <button type="button" className={buttonClass("primary")} onClick={next}>
            Continue
          </button>
        ) : (
          <button className={buttonClass("primary")} disabled={pending}>
            {pending ? "Saving…" : ticket && ticket.priceMinor > 0 ? "Continue to payment" : "Confirm registration"}
          </button>
        )}
      </div>
    </form>
  );
}
