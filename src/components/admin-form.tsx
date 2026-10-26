"use client";

import { useActionState } from "react";
import { buttonClass } from "@/lib/styles";
import type { FormState } from "@/lib/types";

export function AdminForm({
  action,
  children,
  submitLabel = "Save",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });
  return (
    <form action={formAction} className="grid gap-4 border border-line bg-white p-5">
      {state.message ? (
        <p role="status" className={`px-3 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-950" : "bg-red-50 text-red-900"}`}>
          {state.message}
        </p>
      ) : null}
      {children}
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
