"use server";
import { prisma } from "@drivebot/database";
import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta, triggerReload } from "@/lib/bot";
import { revalidatePath } from "next/cache";

export async function saveSuggestionsAction(guildId: string, data: { enabled: boolean; channelId: string }) {
  await assertGuildAccess(guildId);
  if (typeof data?.enabled !== "boolean" || typeof data?.channelId !== "string") return { ok: false, message: "Configuration invalide." };
  if (data.enabled) {
    const meta = await getGuildMeta(guildId);
    if (!meta?.forums?.some((c) => c.id === data.channelId)) return { ok: false, message: "Choisis un forum valide. Le bot doit être connecté pour le vérifier." };
  }
  try {
    await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });
    const values = { enabled: data.enabled, channelId: data.channelId || null };
    await prisma.suggestionConfig.upsert({ where: { guildId }, create: { guildId, ...values }, update: values });
    await triggerReload(guildId);
    revalidatePath(`/dashboard/${guildId}/suggestions`);
    return { ok: true, message: "Suggestions enregistrées." };
  } catch { return { ok: false, message: "Enregistrement impossible. Vérifie la connexion à la base de données." }; }
}
