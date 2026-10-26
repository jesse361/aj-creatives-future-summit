"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactAction } from "@/server/actions/public";
import { INQUIRY_CATEGORIES } from "@/lib/constants";
import { contactSchema } from "@/lib/validation";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";
import type { FormState } from "@/lib/types";
import type { z } from "zod";

const initial: FormState = { ok: false, message: "" };

export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, initial);
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", category: "GENERAL", subject: "", message: "" },
  });

  return (
    <form action={action} className="grid gap-4 border border-line bg-white p-6 sm:p-8" noValidate>
      <input className="hp-field" tabIndex={-1} autoComplete="off" name="companyWebsite" aria-hidden="true" />
      <label className={labelClass}>
        Name
        <input className={inputClass} {...form.register("name")} />
      </label>
      <label className={labelClass}>
        Email
        <input className={inputClass} type="email" autoComplete="email" {...form.register("email")} />
      </label>
      <label className={labelClass}>
        Category
        <select className={inputClass} {...form.register("category")}>
          {INQUIRY_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Subject
        <input className={inputClass} {...form.register("subject")} />
      </label>
      <label className={labelClass}>
        Message
        <textarea className={`${inputClass} min-h-36`} {...form.register("message")} />
      </label>
      {state.message ? (
        <p role="status" className={`px-3 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-950" : "bg-red-50 text-red-900"}`}>
          {state.message}
        </p>
      ) : null}
      <button className={buttonClass("primary")} disabled={pending || state.ok}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
