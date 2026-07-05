"use server";

import { assertGuildAccess } from "@/lib/guard";
import { saveSettings, type SettingsFormData } from "@/lib/config/settings";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";

export async function saveSettingsAction(
  guildId: string,
  data: SettingsFormData,
): Promise<SaveState> {
  if (!guildId) return { ok: false, message: "Serveur manquant." };
  await assertGuildAccess(guildId);

  await saveSettings(guildId, {
    locale: data.locale === "EN" ? "EN" : "FR",
    prefix: (data.prefix.trim() || "!").slice(0, 5),
  });
  return { ok: true, message: "Enregistré ✓" };
}
