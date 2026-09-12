"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    { error: null },
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="block">
        <span className="eyebrow mb-2 block">Mot de passe</span>
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          className="field-input font-mono"
          aria-invalid={state.error ? true : undefined}
        />
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Connexion…" : "Entrer"}
      </button>
      {state.error && (
        <span role="alert" className="text-sm" style={{ color: "var(--danger)" }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
