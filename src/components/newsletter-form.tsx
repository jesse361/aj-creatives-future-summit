"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { newsletterAction } from "@/server/actions/public";
import { buttonClass, inputClass } from "@/lib/styles";
import type { FormState } from "@/lib/types";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  consent: z.boolean().refine((value) => value, { message: "Consent is required." }),
});

const initial: FormState = { ok: false, message: "" };

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(newsletterAction, initial);
  const [transitionPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", consent: false } });
  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("email", values.email);
    data.set("consent", "true");
    startTransition(() => action(data));
  });

  return (
    <form onSubmit={submit} className={compact ? "grid gap-3" : "grid gap-4"} noValidate>
      <input className="hp-field" tabIndex={-1} autoComplete="off" name="companyWebsite" aria-hidden="true" />
      <label className="text-sm text-white">
        <span className="sr-only">Email</span>
        <input className={`${inputClass} border-white/20 bg-transparent text-white placeholder:text-mist`} placeholder="Email address" type="email" {...form.register("email")} />
      </label>
      <label className="flex items-start gap-2 text-xs leading-5 text-mist">
        <input type="checkbox" className="mt-1" {...form.register("consent")} />
        I agree to receive event news from WHY US and I can unsubscribe at any time.
      </label>
      {form.formState.errors.email ? <p className="text-sm text-gold">{form.formState.errors.email.message}</p> : null}
      {form.formState.errors.consent ? <p className="text-sm text-gold">{form.formState.errors.consent.message}</p> : null}
      {state.message ? <p role="status" className="text-sm text-white">{state.message}</p> : null}
      <button className={buttonClass("gold")} disabled={pending || transitionPending}>
        {pending || transitionPending ? "Saving…" : "Subscribe"}
      </button>
    </form>
  );
}
