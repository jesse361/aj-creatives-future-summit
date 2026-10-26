"use client";

import { useActionState } from "react";
import { resetPasswordAction, type LoginState } from "@/server/actions/auth";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";

const initial: LoginState = { message: "" };

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  return (
    <form action={action} className="grid w-full max-w-md gap-4 bg-white p-8">
      <h1 className="font-display text-3xl text-navy">Choose a new password</h1>
      {state.message ? <p role="alert" className="bg-red-50 px-3 py-3 text-sm">{state.message}</p> : null}
      <input type="hidden" name="token" value={token} />
      <label className={labelClass}>
        New password
        <input className={inputClass} name="password" type="password" minLength={12} autoComplete="new-password" required />
      </label>
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Saving…" : "Update password"}</button>
    </form>
  );
}
