"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/actions/auth";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";

const initial: LoginState = { message: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="grid w-full max-w-md gap-4 rounded-3xl bg-white p-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-electric-deep">AJ CREATIVES</p>
      <h1 className="font-display text-3xl text-navy">Organizer sign in</h1>
      <p className="text-sm leading-6 text-slate">This area is for the event organizer. Attendee records are not public.</p>
      {state.message ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-900">{state.message}</p> : null}
      <input type="hidden" name="next" value={nextPath} />
      <label className={labelClass}>
        Email
        <input className={inputClass} name="email" type="email" autoComplete="username" required />
      </label>
      <label className={labelClass}>
        Password
        <input className={inputClass} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={buttonClass("primary")} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
