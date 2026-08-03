"use server";

import { assertGuildAccess } from "@/lib/guard";
import { saveStatusConfig, type StatusFormData } from "@/lib/config/status";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";

export async function saveStatusAction(
  guildId: string,
  data: StatusFormData,
): Promise<SaveState> {
  if (!guildId) return { ok: false, message: "Serveur manquant." };
  await assertGuildAccess(guildId);

  await saveStatusConfig(guildId, {
    enabled: data.enabled,
    channelId: data.channelId || null,
  });
  return { ok: true, message: "Enregistré ✓" };
}
