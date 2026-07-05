import { TextChannel } from "discord.js";
import type { EmbedData } from "@drivebot/types";
import { client } from "../client.js";
import { buildEmbed } from "./embed.js";

/** Envoie un embed dans un salon donné. Utilisé par l'embed builder du dashboard. */
export async function sendEmbedToChannel(
  guildId: string,
  channelId: string,
  data: EmbedData,
): Promise<{ ok: boolean; error?: string }> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return { ok: false, error: "Serveur introuvable." };

  const channel = guild.channels.cache.get(channelId);
  if (!(channel instanceof TextChannel)) {
    return { ok: false, error: "Salon textuel introuvable." };
  }

  try {
    await channel.send({ embeds: [buildEmbed(data)] });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de l'envoi." };
  }
}
