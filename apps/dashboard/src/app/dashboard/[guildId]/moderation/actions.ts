"use server";

import { assertGuildAccess } from "@/lib/guard";
import { saveModerationConfig, type ModerationFormData } from "@/lib/config/moderation";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";

export async function saveModerationAction(
  guildId: string,
  data: ModerationFormData,
): Promise<SaveState> {
  if (!guildId) return { ok: false, message: "Serveur manquant." };
  await assertGuildAccess(guildId);

  await saveModerationConfig(guildId, {
    logEnabled: data.logEnabled,
    logChannel: data.logChannel || null,
  });
  return { ok: true, message: "Enregistré ✓" };
}
