"use server";

import { revalidatePath } from "next/cache";
import type { EmbedData } from "@drivebot/types";
import { assertGuildAccess } from "@/lib/guard";
import { sendEmbedViaBot } from "@/lib/bot";
import { saveTemplate, deleteTemplate } from "@/lib/config/embeds";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function sendEmbedAction(
  guildId: string,
  channelId: string,
  embed: EmbedData,
): Promise<ActionResult> {
  await assertGuildAccess(guildId);
  if (!channelId) return { ok: false, message: "Choisis un salon." };

  const res = await sendEmbedViaBot(guildId, channelId, embed);
  return res.ok
    ? { ok: true, message: "Embed envoyé ✓" }
    : { ok: false, message: res.error ?? "Échec de l'envoi." };
}

export async function saveTemplateAction(
  guildId: string,
  name: string,
  embed: EmbedData,
): Promise<ActionResult> {
  await assertGuildAccess(guildId);
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Donne un nom au modèle." };

  await saveTemplate(guildId, trimmed.slice(0, 80), embed);
  revalidatePath(`/dashboard/${guildId}/embeds`);
  return { ok: true, message: "Modèle enregistré ✓" };
}

export async function deleteTemplateAction(
  guildId: string,
  id: string,
): Promise<ActionResult> {
  await assertGuildAccess(guildId);
  await deleteTemplate(guildId, id);
  revalidatePath(`/dashboard/${guildId}/embeds`);
  return { ok: true, message: "Modèle supprimé." };
}
