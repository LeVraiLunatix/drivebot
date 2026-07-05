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
      <input
        type="password"
        name="password"
        placeholder="Mot de passe"
        autoFocus
        className="field-input text-center"
      />
      <button type="submit" disabled={pending} className="btn-primary w-full justify-center">
        {pending ? "Connexion…" : "Entrer"}
      </button>
      {state.error && <span className="text-sm text-red-400">{state.error}</span>}
    </form>
  );
}
