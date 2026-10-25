"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/server/actions/public";
import { formatMoney } from "@/lib/money";
import { inputClass, labelClass, buttonClass } from "@/lib/styles";
import type { PublicTicket, RegistrationFormState } from "@/lib/types";

const initial: RegistrationFormState = { ok: false, message: "" };

export function RegistrationWizard({
  tickets,
  registrationOpen,
  phoneRequired,
  currencyConfirmed,
  initialTicketId = "",
  paymentCancelled = false,
}: {
  tickets: PublicTicket[];
  registrationOpen: boolean;
  phoneRequired: boolean;
  currencyConfirmed: boolean;
  initialTicketId?: string;
  paymentCancelled?: boolean;
}) {
  const [state, action, pending] = useActionState(registerAction, initial);
  const [step, setStep] = useState(0);
  const [detailError, setDetailError] = useState("");
  const [ticketId, setTicketId] = useState(initialTicketId || tickets.find((ticket) => ticket.capacity > ticket.sold)?.id || "");
  const [quantity, setQuantity] = useState(1);
  const selected = tickets.find((ticket) => ticket.id === ticketId) ?? null;
  const remaining = selected ? Math.max(selected.capacity - selected.sold, 0) : 0;
  const maxQuantity = Math.min(8, remaining);

  if (!registrationOpen) {
    return <p className="rounded-3xl bg-white p-8">Registration is currently closed.</p>;
  }
  if (tickets.length === 0) {
    return <p className="rounded-3xl bg-white p-8">Tickets have not been published yet.</p>;
  }

  const show = (index: number) => step === index;

  return (
    <form
      action={action}
      className="rounded-3xl bg-white p-5 sm:p-8"
      onSubmit={(event) => {
        const field = event.currentTarget.elements.namedItem("idempotencyKey");
        if (field instanceof HTMLInputElement && !field.value) field.value = crypto.randomUUID();
      }}
    >
      <input type="hidden" name="idempotencyKey" />
      <p className="hp-field">
        <label>
          Company website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      {paymentCancelled ? (
        <p className="mb-6 rounded-2xl bg-paper px-4 py-3 text-sm leading-6" role="status">
          Payment was cancelled. If a request was already saved, it remains unpaid and is not a confirmed ticket.
        </p>
      ) : null}
      {state.message ? (
        <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.message}
        </p>
      ) : null}

      <section hidden={!show(0)} className="grid gap-4">
        <h2 className="font-display text-2xl text-navy">1. Select a ticket</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {tickets.map((ticket) => {
            const places = ticket.capacity - ticket.sold;
            return (
              <label key={ticket.id} className={`rounded-3xl border p-5 ${ticketId === ticket.id ? "border-electric-deep bg-electric/5" : "border-line"}`}>
                <input
                  type="radio"
                  name="ticketTypeId"
                  value={ticket.id}
                  checked={ticketId === ticket.id}
                  onChange={() => {
                    setTicketId(ticket.id);
                    setQuantity(1);
                  }}
                  disabled={places <= 0}
                  className="sr-only"
                />
                <span className="block font-display text-xl text-navy">{ticket.name}</span>
                <span className="mt-2 block text-2xl font-semibold text-navy">{ticket.priceCents === 0 ? "Free" : formatMoney(ticket.priceCents, ticket.currency)}</span>
                {ticket.isSample ? <span className="mt-2 block text-xs font-semibold text-electric-deep">Sample price — not official</span> : null}
                {!currencyConfirmed ? <span className="mt-1 block text-xs text-slate">Currency not confirmed</span> : null}
                <span className="mt-3 block text-sm leading-6 text-slate">{ticket.description}</span>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate">
                  {ticket.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
                <span className="mt-3 block text-sm font-medium text-navy">{places > 0 ? `${places} places remaining` : "Sold out"}</span>
              </label>
            );
          })}
        </div>
        <button type="button" className={buttonClass("primary", "mt-2 w-fit")} onClick={() => selected && remaining > 0 && setStep(1)} disabled={!selected || remaining <= 0}>
          Continue
        </button>
      </section>

      <section hidden={!show(1)} className="mt-8">
        <h2 className="font-display text-2xl text-navy">2. Quantity</h2>
        <label className={`${labelClass} mt-4 max-w-xs`}>
          Number of places
          <input
            className={inputClass}
            name="quantity"
            type="number"
            min={1}
            max={Math.max(maxQuantity, 1)}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            required
          />
        </label>
        <div className="mt-4 flex gap-3">
          <button type="button" className={buttonClass("ghost")} onClick={() => setStep(0)}>
            Back
          </button>
          <button type="button" className={buttonClass("primary")} onClick={() => quantity >= 1 && quantity <= maxQuantity && setStep(2)} disabled={quantity < 1 || quantity > maxQuantity}>
            Continue
          </button>
        </div>
      </section>

      <section hidden={!show(2)} className="mt-8 grid gap-4 sm:grid-cols-2">
        <h2 className="font-display text-2xl text-navy sm:col-span-2">3. Your details</h2>
        <label className={labelClass}>
          Full name <span className="text-electric-deep">*</span>
          <input className={inputClass} name="fullName" autoComplete="name" required aria-invalid={Boolean(state.fieldErrors?.fullName)} />
          {state.fieldErrors?.fullName ? <span className="mt-1 block text-sm text-red-800">{state.fieldErrors.fullName}</span> : null}
        </label>
        <label className={labelClass}>
          Email address <span className="text-electric-deep">*</span>
          <input className={inputClass} name="email" type="email" autoComplete="email" required aria-invalid={Boolean(state.fieldErrors?.email)} />
          {state.fieldErrors?.email ? <span className="mt-1 block text-sm text-red-800">{state.fieldErrors.email}</span> : null}
        </label>
        <label className={labelClass}>
          Phone {phoneRequired ? <span className="text-electric-deep">*</span> : <span className="font-normal text-slate">(optional)</span>}
          <input className={inputClass} name="phone" type="tel" autoComplete="tel" required={phoneRequired} aria-invalid={Boolean(state.fieldErrors?.phone)} />
          {state.fieldErrors?.phone ? <span className="mt-1 block text-sm text-red-800">{state.fieldErrors.phone}</span> : null}
        </label>
        <label className={labelClass}>
          Organization or institution <span className="font-normal text-slate">(optional)</span>
          <input className={inputClass} name="organization" autoComplete="organization" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Job title or role <span className="font-normal text-slate">(optional)</span>
          <input className={inputClass} name="jobTitle" autoComplete="organization-title" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Dietary or accessibility requirements <span className="font-normal text-slate">(optional)</span>
          <textarea className={inputClass} name="notes" rows={3} />
        </label>
        {detailError ? <p className="text-sm text-red-800 sm:col-span-2">{detailError}</p> : null}
        <div className="flex gap-3 sm:col-span-2">
          <button type="button" className={buttonClass("ghost")} onClick={() => setStep(1)}>
            Back
          </button>
          <button
            type="button"
            className={buttonClass("primary")}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (!form) return;
              const data = new FormData(form);
              const name = String(data.get("fullName") ?? "").trim();
              const email = String(data.get("email") ?? "").trim();
              const phone = String(data.get("phone") ?? "").trim();
              if (name.length < 2 || !email.includes("@") || (phoneRequired && phone.length < 7)) {
                setDetailError("Enter your name, a valid email address, and a phone number if it is required.");
                return;
              }
              setDetailError("");
              setStep(3);
            }}
          >
            Review
          </button>
        </div>
      </section>

      <section hidden={!show(3)} className="mt-8">
        <h2 className="font-display text-2xl text-navy">4. Review and submit</h2>
        {selected ? (
          <div className="mt-4 rounded-2xl bg-paper p-4 text-sm leading-7">
            <p>
              <strong className="text-navy">{selected.name}</strong> × {quantity}
            </p>
            <p>{selected.priceCents === 0 ? "No charge." : `Sample total ${formatMoney(selected.priceCents * quantity, selected.currency)}.`}</p>
            <p>{selected.priceCents === 0 ? "A free registration can be confirmed when it is saved." : "A priced registration is a request until payment is verified. It is not a confirmed ticket at submission."}</p>
            {selected.eligibilityNote ? <p>{selected.eligibilityNote}</p> : null}
          </div>
        ) : null}
        {selected?.eligibilityNote ? (
          <label className="mt-4 flex items-start gap-3 text-sm leading-6">
            <input className="mt-1" type="checkbox" name="eligibilityAccepted" />
            <span>I confirm that I meet the eligibility note for this ticket.</span>
          </label>
        ) : (
          <input type="hidden" name="eligibilityAccepted" value="" />
        )}
        <label className="mt-4 flex items-start gap-3 text-sm leading-6">
          <input className="mt-1" type="checkbox" name="termsAccepted" required />
          <span>
            I agree to the <a className="font-semibold text-electric-deep" href="/terms">registration terms</a> and <a className="font-semibold text-electric-deep" href="/privacy">privacy notice</a>. <span className="text-electric-deep">*</span>
          </span>
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className={buttonClass("ghost")} onClick={() => setStep(2)}>
            Back
          </button>
          <button type="submit" className={buttonClass("primary")} disabled={pending} aria-busy={pending}>
            {pending ? "Saving registration…" : "Submit registration"}
          </button>
        </div>
      </section>
    </form>
  );
}
