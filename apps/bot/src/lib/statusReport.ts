import { EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "@drivebot/database";
import type { BotStatus } from "@drivebot/types";
import { client } from "../client.js";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}

/** Vérifie que la base de données répond. */
async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** Rassemble l'état actuel du process bot (ping, uptime, mémoire, membres, DB…). */
export async function collectBotStatus(): Promise<BotStatus> {
  const dbOk = await checkDatabase();
  const memberCount = client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0);

  return {
    online: true,
    pingMs: Math.round(client.ws.ping),
    uptimeSeconds: Math.round(process.uptime()),
    guildCount: client.guilds.cache.size,
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    memberCount,
    dbOk,
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
  };
}

/** Construit l'embed d'état actuel du bot, pour publication dans un salon. */
async function buildStatusEmbed(): Promise<EmbedBuilder> {
  const status = await collectBotStatus();
  const startedUnix = Math.floor(new Date(status.startedAt).getTime() / 1000);

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🟢 État de Drivebot")
    .addFields(
      { name: "Statut", value: "En ligne", inline: true },
      { name: "Ping", value: `${status.pingMs} ms`, inline: true },
      { name: "Uptime", value: formatUptime(status.uptimeSeconds), inline: true },
      { name: "Serveurs", value: `${status.guildCount}`, inline: true },
      { name: "Membres", value: `${status.memberCount}`, inline: true },
      { name: "Mémoire", value: `${status.memoryMb} MB`, inline: true },
      { name: "Base de données", value: status.dbOk ? "✅ OK" : "❌ Injoignable", inline: true },
      { name: "Dernier redémarrage", value: `<t:${startedUnix}:R>`, inline: true },
    )
    .setTimestamp();
}

/** Édite le message de rapport existant, ou en envoie un nouveau si introuvable
 *  (premier rapport, message supprimé, salon changé…). */
async function postStatusForGuild(
  guildId: string,
  channelId: string,
  messageId: string | null,
  embed: EmbedBuilder,
): Promise<void> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(channelId);
  if (!(channel instanceof TextChannel)) return;

  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] }).catch(() => {});
      return;
    }
  }

  const sent = await channel.send({ embeds: [embed] }).catch(() => null);
  if (sent) {
    await prisma.botStatusConfig
      .update({ where: { guildId }, data: { messageId: sent.id } })
      .catch(() => {});
  }
}

/** Poste le rapport d'état dans tous les serveurs où la fonctionnalité est activée. */
async function postStatusToAllGuilds(): Promise<void> {
  const configs = await prisma.botStatusConfig.findMany({
    where: { enabled: true, channelId: { not: null } },
  });
  if (configs.length === 0) return;

  const embed = await buildStatusEmbed();
  for (const cfg of configs) {
    if (cfg.channelId) await postStatusForGuild(cfg.guildId, cfg.channelId, cfg.messageId, embed);
  }
}

/** Démarre le rapport d'état automatique (toutes les 30 minutes). */
export function startStatusReports(): void {
  const THIRTY_MIN = 30 * 60 * 1000;
  setInterval(() => {
    postStatusToAllGuilds().catch((err) => console.error("[status] échec du rapport", err));
  }, THIRTY_MIN);
}
