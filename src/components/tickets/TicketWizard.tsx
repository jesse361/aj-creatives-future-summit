"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitRegistrationAction } from "@/actions/register";
import type { SiteData } from "@/lib/event-data";
import { zodFieldErrors } from "@/lib/security";
import { registrationSchema } from "@/lib/validation";

type Ticket = SiteData["tickets"][number];

function formatWhen(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || "UTC",
  }).format(new Date(iso));
}

function storageKey() {
  const existing = sessionStorage.getItem("fs-registration-key");
  if (existing) return existing;
  const key = crypto.randomUUID();
  sessionStorage.setItem("fs-registration-key", key);
  return key;
}

export function TicketWizard({
  tickets,
  registrationOpen,
  maxTicketsPerOrder,
  requirePhone,
  samplePrices,
  timezone,
}: {
  tickets: Ticket[];
  registrationOpen: boolean;
  maxTicketsPerOrder: number;
  requirePhone: boolean;
  samplePrices: boolean;
  timezone: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ticketId, setTicketId] = useState(tickets.find((ticket) => ticket.remaining > 0)?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const selected = tickets.find((ticket) => ticket.id === ticketId);

  if (tickets.length === 0) {
    return (
      <div className="surface-card p-8">
        <h2 className="text-3xl">Tickets coming soon</h2>
        <p className="mt-3 text-muted">Ticket categories have not been published yet.</p>
      </div>
    );
  }

  async function submit() {
    if (lock.current || !selected) return;
    const input = {
      ticketTypeId: selected.id,
      quantity,
      fullName,
      email,
      phone,
      organization,
      jobTitle,
      dietaryNotes,
      acceptTerms,
      idempotencyKey: storageKey(),
      companyWebsite,
    };
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) {
      const nextErrors = zodFieldErrors(parsed.error.issues);
      setErrors(nextErrors);
      if (nextErrors.fullName || nextErrors.email || nextErrors.phone) setStep(2);
      return;
    }
    lock.current = true;
    setPending(true);
    setErrors({});
    const result = await submitRegistrationAction(parsed.data);
    setPending(false);
    lock.current = false;
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.quantity || result.errors.form) setStep(result.errors.phone || result.errors.fullName ? 2 : 3);
      return;
    }
    sessionStorage.removeItem("fs-registration-key");
    if (result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    router.push(`/tickets/confirmation/${result.reference}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <ol className="mb-5 flex gap-3 text-xs uppercase tracking-[0.14em] text-muted" aria-label="Registration steps">
          {["Ticket", "Details", "Review"].map((label, index) => (
            <li key={label} className={step === index + 1 ? "text-action" : ""}>
              0{index + 1} {label}
            </li>
          ))}
        </ol>
        {step === 1 ? (
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-2xl font-display text-navy">Choose a ticket</legend>
            {tickets.map((ticket) => {
              const unavailable = ticket.remaining < 1;
              return (
                <label key={ticket.id} className={`surface-card block p-5 ${ticketId === ticket.id ? "ring-2 ring-electric" : ""}`}>
                  <span className="flex items-start justify-between gap-4">
                    <span>
                      <input
                        className="mr-3"
                        type="radio"
                        name="ticket"
                        checked={ticketId === ticket.id}
                        disabled={unavailable}
                        onChange={() => setTicketId(ticket.id)}
                      />
                      <span className="font-display text-2xl text-navy">{ticket.name}</span>
                      {ticket.isSample ? (
                        <span className="ml-2 rounded-full bg-paper px-2 py-1 text-xs text-muted">Sample price</span>
                      ) : null}
                    </span>
                    <span className="font-display text-xl text-navy">{ticket.priceLabel}</span>
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-muted">{ticket.description}</span>
                  <ul className="mt-3 grid gap-1 text-sm">
                    {ticket.benefits.map((benefit) => (
                      <li key={benefit}>· {benefit}</li>
                    ))}
                  </ul>
                  <span className="mt-3 block text-sm text-muted">
                    {unavailable ? "Sold out" : `${ticket.remaining} of ${ticket.capacity} remaining`}
                    {" · "}
                    {ticket.currency}
                    {ticket.salesStart ? ` · Sales from ${formatWhen(ticket.salesStart, timezone)}` : ""}
                    {ticket.salesEnd ? ` · Sales until ${formatWhen(ticket.salesEnd, timezone)}` : ""}
                  </span>
                  {ticket.eligibilityNote ? <span className="mt-2 block text-sm text-muted">{ticket.eligibilityNote}</span> : null}
                </label>
              );
            })}
            <label className="field max-w-xs">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                max={Math.min(maxTicketsPerOrder, selected?.remaining || 1)}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            {errors.quantity ? (
              <p role="alert" className="text-sm text-[#9f1239]">
                {errors.quantity}
              </p>
            ) : null}
            <button type="button" className="btn btn-primary w-fit" disabled={!registrationOpen || !selected} onClick={() => setStep(2)}>
              Continue
            </button>
          </fieldset>
        ) : null}
        {step === 2 ? (
          <form
            className="surface-card grid gap-4 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              setStep(3);
            }}
          >
            <h2 className="text-2xl">Your details</h2>
            <Field id="fullName" label="Full name" required error={errors.fullName}>
              <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" />
            </Field>
            <Field id="email" label="Email address" required error={errors.email}>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </Field>
            <Field id="phone" label="Phone number" required={requirePhone} error={errors.phone}>
              <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required={requirePhone} />
            </Field>
            <Field id="organization" label="Organization or institution" error={errors.organization}>
              <input id="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} />
            </Field>
            <Field id="jobTitle" label="Job title or role" error={errors.jobTitle}>
              <input id="jobTitle" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </Field>
            <Field id="dietaryNotes" label="Dietary or accessibility requirements" error={errors.dietaryNotes}>
              <textarea id="dietaryNotes" value={dietaryNotes} onChange={(event) => setDietaryNotes(event.target.value)} />
            </Field>
            <div className="absolute -left-[9999px]" aria-hidden>
              <label>
                Company website
                <input value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Review
              </button>
            </div>
          </form>
        ) : null}
        {step === 3 && selected ? (
          <div className="surface-card p-6">
            <h2 className="text-2xl">Review registration</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt>Ticket</dt><dd>{selected.name}</dd></div>
              <div className="flex justify-between gap-4"><dt>Quantity</dt><dd>{quantity}</dd></div>
              <div className="flex justify-between gap-4"><dt>Price each</dt><dd>{selected.priceLabel}</dd></div>
              <div className="flex justify-between gap-4"><dt>Name</dt><dd>{fullName}</dd></div>
              <div className="flex justify-between gap-4"><dt>Email</dt><dd>{email}</dd></div>
              {phone ? <div className="flex justify-between gap-4"><dt>Phone</dt><dd>{phone}</dd></div> : null}
            </dl>
            {samplePrices ? (
              <p className="mt-4 text-sm text-muted">Sample prices are demonstration amounts, not official rates.</p>
            ) : null}
            {selected.priceMinor > 0 ? (
              <p className="mt-3 text-sm text-muted">
                Paid categories are saved as registration requests. A ticket is confirmed only after verified payment, or immediately when the ticket is free.
              </p>
            ) : null}
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1" />
              <span>
                I agree to the <a className="text-action underline" href="/terms">registration terms</a> and{" "}
                <a className="text-action underline" href="/privacy">privacy notice</a>.
                <span className="text-action"> *</span>
              </span>
            </label>
            {errors.acceptTerms ? <p role="alert" className="mt-2 text-sm text-[#9f1239]">{errors.acceptTerms}</p> : null}
            {errors.form ? <p role="alert" className="mt-2 text-sm text-[#9f1239]">{errors.form}</p> : null}
            <div className="mt-5 flex gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)} disabled={pending}>
                Back
              </button>
              <button type="button" className="btn btn-primary" onClick={submit} disabled={pending || !registrationOpen}>
                {pending ? "Submitting registration…" : "Submit registration"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <aside className="surface-card h-fit p-6">
        <h2 className="text-xl">Before you register</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {registrationOpen
            ? "Your registration is saved on the server. You will only see a confirmation after it is stored."
            : "Registration is currently closed."}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          The form collects your name, email, optional organization details, and any access or dietary notes needed to host you.
        </p>
      </aside>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {required ? <span className="text-action"> *</span> : null}
        {required ? <span className="sr-only"> required</span> : null}
      </span>
      {children}
      {error ? (
        <span id={`${id}-error`} role="alert" className="text-sm text-[#9f1239]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
