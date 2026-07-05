"use server";

import { assertGuildAccess } from "@/lib/guard";
import { saveWelcomeConfig, type WelcomeFormData } from "@/lib/config/welcome";

export interface SaveState {
  ok: boolean;
  message?: string;
}

/** Server action : enregistre la config bienvenue/autorole d'un serveur.
 *  Re-vérifie l'accès car une action est une route publique. */
export async function saveWelcome(
  guildId: string,
  data: WelcomeFormData,
): Promise<SaveState> {
  if (!guildId) return { ok: false, message: "Serveur manquant." };
  await assertGuildAccess(guildId);
  await saveWelcomeConfig(guildId, data);
  return { ok: true, message: "Enregistré ✓" };
}
