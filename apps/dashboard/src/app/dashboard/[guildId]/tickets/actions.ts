"use server";

import { assertGuildAccess } from "@/lib/guard";
import { saveTicketsConfig, type TicketsFormData } from "@/lib/config/tickets";
import { publishTicketPanelViaBot } from "@/lib/bot";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";

export async function saveTicketsAction(
  guildId: string,
  data: TicketsFormData,
): Promise<SaveState> {
  if (!guildId) return { ok: false, message: "Serveur manquant." };
  await assertGuildAccess(guildId);
  await saveTicketsConfig(guildId, data);
  return { ok: true, message: "Enregistré ✓" };
}

/** Publie le panneau de tickets dans le salon configuré (via le bot). */
export async function publishPanelAction(guildId: string): Promise<SaveState> {
  await assertGuildAccess(guildId);
  const res = await publishTicketPanelViaBot(guildId);
  return res.ok
    ? { ok: true, message: "Panneau publié ✓" }
    : { ok: false, message: res.error ?? "Échec de la publication." };
}
