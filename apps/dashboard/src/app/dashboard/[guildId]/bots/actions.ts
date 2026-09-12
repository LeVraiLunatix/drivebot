"use server";

import { assertGuildAccess } from "@/lib/guard";
import { controlBot } from "@/lib/bot";
import { revalidatePath } from "next/cache";

export async function managedBotAction(guildId: string, botId: string, data: unknown) {
  await assertGuildAccess(guildId);
  if (!/^\d{17,20}$/.test(botId)) return { ok: false, error: "Identifiant de bot invalide." };
  const result = await controlBot(`/internal/guilds/${guildId}/bots/${botId}/control`, data);
  revalidatePath(`/dashboard/${guildId}/bots`);
  return result;
}

export async function reloadBotAction(guildId: string) {
  await assertGuildAccess(guildId);
  return controlBot("/internal/reload", { guildId });
}

export async function moderateAction(guildId: string, data: { action: string; targetId: string; reason: string; minutes: number }) {
  await assertGuildAccess(guildId);
  const result = await controlBot(`/internal/guilds/${guildId}/moderate`, data);
  revalidatePath(`/dashboard/${guildId}/moderation`);
  return result;
}
