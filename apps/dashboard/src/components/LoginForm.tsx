"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    { error: null },
  );

  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-3">
      <input
        type="password"
        name="password"
        placeholder="Mot de passe"
        autoFocus
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Entrer"}
      </button>
      {state.error && <span className="text-sm text-red-400">{state.error}</span>}
    </form>
  );
}
