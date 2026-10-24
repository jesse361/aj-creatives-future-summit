"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { message: "" });
  return (
    <form action={action} className="surface-card grid gap-4 p-6">
      <label className="field">
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.message ? (
        <p role="alert" className="text-sm text-[#9f1239]">
          {state.message}
        </p>
      ) : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
