"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/server/actions/public";
import { INQUIRY_CATEGORIES } from "@/lib/constants";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import type { ContactFormState } from "@/lib/types";

const initial: ContactFormState = { status: "idle", message: "" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitInquiry, initial);

  if (state.status === "success") {
    return (
      <p className="rounded-3xl bg-white p-8 leading-7 text-navy" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-4 rounded-3xl bg-white p-5 sm:p-8">
      <p className="hp-field">
        <label>
          Company website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      {state.message ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.message}
        </p>
      ) : null}
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
        Inquiry category <span className="text-electric-deep">*</span>
        <select className={inputClass} name="category" required defaultValue="GENERAL">
          {INQUIRY_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Message <span className="text-electric-deep">*</span>
        <textarea className={inputClass} name="message" rows={6} required aria-invalid={Boolean(state.fieldErrors?.message)} />
        {state.fieldErrors?.message ? <span className="mt-1 block text-sm text-red-800">{state.fieldErrors.message}</span> : null}
      </label>
      <button type="submit" className={buttonClass("primary", "w-fit")} disabled={pending} aria-busy={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
