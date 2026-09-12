import type { EmbedData } from "@drivebot/types";
import { client } from "../client.js";
import { buildEmbed } from "./embed.js";
import { sendAsManagedBot } from "./managedBots.js";

/** Envoie un embed dans un salon donné. Utilisé par l'embed builder du dashboard. */
export async function sendEmbedToChannel(
  guildId: string,
  botId: string | undefined,
  channelId: string,
  data: EmbedData,
): Promise<{ ok: boolean; error?: string }> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return { ok: false, error: "Serveur introuvable." };

  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) {
    return { ok: false, error: "Salon textuel introuvable." };
  }

  try {
    await sendAsManagedBot(botId, guildId, channelId, { embeds: [buildEmbed(data).toJSON()] });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de l'envoi." };
  }
}
