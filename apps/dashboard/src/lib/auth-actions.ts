"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export interface LoginState {
  error: string | null;
}

/** Vérifie le mot de passe et ouvre la session, sinon renvoie une erreur. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return { error: null };
  } catch (e) {
    // signIn lève une redirection en cas de succès : on la laisse remonter.
    if (e instanceof AuthError) return { error: "Mot de passe incorrect." };
    throw e;
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
