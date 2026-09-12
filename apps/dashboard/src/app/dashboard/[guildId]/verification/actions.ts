"use server";

import { assertGuildAccess } from "@/lib/guard";
import { saveVerificationConfig, type VerificationFormData } from "@/lib/config/verification";
import { publishVerifPanelViaBot } from "@/lib/bot";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";

export async function saveVerificationAction(
  guildId: string,
  data: VerificationFormData,
): Promise<SaveState> {
  if (!guildId) return { ok: false, message: "Serveur manquant." };
  await assertGuildAccess(guildId);
  await saveVerificationConfig(guildId, data);
  return { ok: true, message: "Enregistré ✓" };
}

export async function publishVerifPanelAction(
  guildId: string,
  data: VerificationFormData,
): Promise<SaveState> {
  await assertGuildAccess(guildId);
  await saveVerificationConfig(guildId, data);
  const res = await publishVerifPanelViaBot(guildId);
  return res.ok
    ? { ok: true, message: "Panneau publié ✓" }
    : { ok: false, message: res.error ?? "Échec de la publication." };
}
