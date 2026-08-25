"use server";

import { assertGuildAccess } from "@/lib/guard";
import {
  createPanel,
  savePanel,
  deletePanel,
  type ReactionRolePanelFormData,
} from "@/lib/config/reactionRoles";
import { publishReactionRolePanelViaBot } from "@/lib/bot";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";

export async function createPanelAction(guildId: string): Promise<ReactionRolePanelFormData> {
  await assertGuildAccess(guildId);
  return createPanel(guildId);
}

export async function savePanelAction(
  guildId: string,
  panelId: string,
  data: ReactionRolePanelFormData,
): Promise<SaveState> {
  await assertGuildAccess(guildId);
  await savePanel(guildId, panelId, data);
  return { ok: true, message: "Enregistré ✓" };
}

export async function deletePanelAction(guildId: string, panelId: string): Promise<SaveState> {
  await assertGuildAccess(guildId);
  await deletePanel(guildId, panelId);
  return { ok: true };
}

/** Publie ou republie (édite) le panneau dans le salon configuré. */
export async function publishPanelAction(guildId: string, panelId: string): Promise<SaveState> {
  await assertGuildAccess(guildId);
  const res = await publishReactionRolePanelViaBot(guildId, panelId);
  return res.ok
    ? { ok: true, message: "Panneau publié ✓" }
    : { ok: false, message: res.error ?? "Échec de la publication." };
}
