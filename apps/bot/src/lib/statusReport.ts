import { EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@drivebot/database";
import { client } from "../client.js";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}

/** Construit l'embed d'état actuel du bot (ping, uptime, mémoire, serveurs). */
function buildStatusEmbed(): EmbedBuilder {
  const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🟢 État de Drivebot")
    .addFields(
      { name: "Statut", value: "En ligne", inline: true },
      { name: "Ping", value: `${Math.round(client.ws.ping)} ms`, inline: true },
      { name: "Uptime", value: formatUptime(process.uptime()), inline: true },
      { name: "Serveurs", value: `${client.guilds.cache.size}`, inline: true },
      { name: "Mémoire", value: `${memoryMb} MB`, inline: true },
    )
    .setTimestamp();
}

/** Poste le rapport d'état dans le salon configuré d'un serveur (si activé). */
async function postStatusForGuild(guildId: string, channelId: string): Promise<void> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(channelId);
  if (!(channel instanceof TextChannel)) return;

  await channel.send({ embeds: [buildStatusEmbed()] }).catch(() => {});
}

/** Poste le rapport d'état dans tous les serveurs où la fonctionnalité est activée. */
async function postStatusToAllGuilds(): Promise<void> {
  const configs = await prisma.botStatusConfig.findMany({
    where: { enabled: true, channelId: { not: null } },
  });

  for (const cfg of configs) {
    if (cfg.channelId) await postStatusForGuild(cfg.guildId, cfg.channelId);
  }
}

/** Démarre le rapport d'état automatique (toutes les 30 minutes). */
export function startStatusReports(): void {
  const THIRTY_MIN = 30 * 60 * 1000;
  setInterval(() => {
    postStatusToAllGuilds().catch((err) => console.error("[status] échec du rapport", err));
  }, THIRTY_MIN);
}
