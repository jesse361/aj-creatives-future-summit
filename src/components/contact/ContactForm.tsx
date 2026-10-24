"use client";

import { useState } from "react";
import { submitContactAction } from "@/actions/contact";
import { INQUIRY_CATEGORIES } from "@/lib/constants";
import { zodFieldErrors } from "@/lib/security";
import { contactSchema } from "@/lib/validation";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ forwarded: boolean } | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState("");

  async function onSubmit(formData: FormData) {
    const input = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      category: String(formData.get("category") ?? ""),
      message: String(formData.get("message") ?? ""),
      companyWebsite,
    };
    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error.issues));
      return;
    }
    setPending(true);
    setErrors({});
    const result = await submitContactAction(parsed.data);
    setPending(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setDone({ forwarded: result.forwarded });
  }

  if (done) {
    return (
      <div className="surface-card p-8" role="status">
        <h2 className="text-3xl">Message saved</h2>
        <p className="mt-3 text-muted">
          Your inquiry is stored for the organizer.
          {done.forwarded ? " A copy was also sent to the published event email." : " Email forwarding is not configured, so delivery depends on the admin inbox."}
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="surface-card grid gap-4 p-6" noValidate>
      <Field id="fullName" label="Full name" required error={errors.fullName}>
        <input id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field id="email" label="Email address" required error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="category" label="Inquiry category" required error={errors.category}>
        <select id="category" name="category" defaultValue="GENERAL" required>
          {INQUIRY_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="message" label="Message" required error={errors.message}>
        <textarea id="message" name="message" required />
      </Field>
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>
          Company website
          <input value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {errors.form ? (
        <p role="alert" className="text-sm text-[#9f1239]">
          {errors.form}
        </p>
      ) : null}
      <button className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
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
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-sm text-[#9f1239]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
