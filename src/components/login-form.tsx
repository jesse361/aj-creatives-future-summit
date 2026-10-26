"use client";

import { useActionState } from "react";
import { loginAction, requestResetAction, type LoginState } from "@/server/actions/auth";
import { buttonClass, inputClass, labelClass } from "@/lib/styles";

const initial: LoginState = { message: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [resetState, resetAction, resetPending] = useActionState(requestResetAction, initial);
  return (
    <div className="grid w-full max-w-md gap-8 bg-white p-8">
      <form action={action} className="grid gap-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-gold">WHY US</p>
        <h1 className="font-display text-3xl text-navy">Administrator sign in</h1>
        <p className="text-sm leading-6 text-ink-soft">Attendee records stay in this private area.</p>
        {state.message ? <p role="alert" className="bg-red-50 px-4 py-3 text-sm text-red-900">{state.message}</p> : null}
        <input type="hidden" name="next" value={nextPath} />
        <label className={labelClass}>Email<input className={inputClass} name="email" type="email" autoComplete="username" required /></label>
        <label className={labelClass}>Password<input className={inputClass} name="password" type="password" autoComplete="current-password" required /></label>
        <button className={buttonClass("primary")} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <form action={resetAction} className="grid gap-3 border-t border-line pt-6">
        <h2 className="font-display text-xl">Password recovery</h2>
        <p className="text-sm text-ink-soft">A reset email is sent only when email delivery is configured.</p>
        {resetState.message ? <p role="status" className="text-sm">{resetState.message}</p> : null}
        <label className={labelClass}>Email<input className={inputClass} name="email" type="email" required /></label>
        <button className={buttonClass("ghost")} disabled={resetPending}>{resetPending ? "Sending…" : "Email a reset link"}</button>
      </form>
    </div>
  );
}
