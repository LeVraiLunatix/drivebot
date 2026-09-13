import { EmbedBuilder } from "discord.js";
import { prisma } from "@drivebot/database";
import type { BotStatus } from "@drivebot/types";
import { client } from "../client.js";
import { editAsManagedBot, managedBotStatuses, sendAsManagedBot } from "./managedBots.js";

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
    online: client.isReady(),
    pingMs: Math.round(client.ws.ping),
    uptimeSeconds: Math.round(process.uptime()),
    guildCount: client.guilds.cache.size,
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    memberCount,
    dbOk,
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
  };
}

/** Construit l'embed d'état du centre de contrôle. */
async function buildControlStatusEmbed(): Promise<EmbedBuilder> {
  const status = await collectBotStatus();
  const startedUnix = Math.floor(new Date(status.startedAt).getTime() / 1000);

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🟢 État du centre de contrôle")
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

async function buildSiteStatusEmbed(): Promise<EmbedBuilder> {
  const siteUrl = process.env.STATUS_SITE_URL || "https://cordsuite.app";
  const started = Date.now();
  let online = false;
  let statusCode: number | null = null;
  try {
    const response = await fetch(siteUrl, { method: "HEAD", signal: AbortSignal.timeout(8_000), redirect: "follow" });
    statusCode = response.status;
    online = response.status < 500;
  } catch {}
  const latency = Date.now() - started;
  return new EmbedBuilder()
    .setColor(online ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`${online ? "🟢" : "🔴"} cordsuite.app`)
    .setURL(siteUrl)
    .setDescription("État du site et du dashboard Cordsuite.")
    .addFields(
      { name: "Statut", value: online ? "En ligne" : "Indisponible", inline: true },
      { name: "Réponse", value: `${latency} ms`, inline: true },
      { name: "HTTP", value: statusCode ? `${statusCode}` : "Aucune réponse", inline: true },
    )
    .setFooter({ text: "Mise à jour automatique toutes les 30 minutes" })
    .setTimestamp();
}

function buildManagedBotStatusEmbed(bot: ReturnType<typeof managedBotStatuses>[number]): EmbedBuilder {
  const since = bot.connectedAt ? `<t:${Math.floor(bot.connectedAt.getTime() / 1000)}:R>` : "—";
  const activity = bot.preferences.activity || "Aucune activité";
  return new EmbedBuilder()
    .setColor(bot.online ? 0x2ecc71 : 0xe74c3c)
    .setTitle(`${bot.online ? "🟢" : "🔴"} ${bot.name}`)
    .setThumbnail(bot.avatarUrl)
    .setDescription("État individuel du bot Discord.")
    .addFields(
      { name: "Statut", value: bot.online ? "En ligne" : "Hors ligne", inline: true },
      { name: "Latence", value: bot.pingMs === null ? "—" : `${bot.pingMs} ms`, inline: true },
      { name: "Connecté depuis", value: since, inline: true },
      { name: "Activité", value: activity, inline: true },
      { name: "Présence", value: bot.preferences.status, inline: true },
      { name: "Connexion", value: bot.error || "✅ Stable", inline: true },
    )
    .setFooter({ text: "Mise à jour automatique toutes les 30 minutes" })
    .setTimestamp();
}

/** Édite le message de rapport existant, ou en envoie un nouveau si introuvable
 *  (premier rapport, message supprimé, salon changé…). */
async function upsertStatusMessage(
  guildId: string,
  channelId: string,
  messageId: string | null,
  embed: EmbedBuilder,
  botId: string | null,
): Promise<string | null> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  if (messageId) {
    const existing = await editAsManagedBot(botId, channelId, messageId, { embeds: [embed.toJSON()] }).catch(() => null);
    if (existing) {
      return existing.id;
    }
  }
  const sent = await sendAsManagedBot(botId, guildId, channelId, { embeds: [embed.toJSON()] }).catch(() => null);
  return sent?.id ?? null;
}

export async function publishStatusBoard(guildId: string): Promise<{ ok: boolean; error?: string }> {
  const cfg = await prisma.botStatusConfig.findUnique({ where: { guildId } });
  if (!cfg?.enabled || !cfg.channelId) return { ok: false, error: "Le rapport de statut n'est pas activé ou son salon est manquant." };
  const stored = cfg.messageIds && typeof cfg.messageIds === "object" && !Array.isArray(cfg.messageIds)
    ? cfg.messageIds as Record<string, string>
    : {};
  const next: Record<string, string> = { ...stored };
  const siteSenderId = cfg.botId;
  const siteMessageId = await upsertStatusMessage(
    guildId,
    cfg.channelId,
    next.site || cfg.messageId,
    await buildSiteStatusEmbed(),
    siteSenderId,
  );
  if (siteMessageId) next.site = siteMessageId;

  for (const bot of managedBotStatuses()) {
    const messageId = await upsertStatusMessage(
      guildId,
      cfg.channelId,
      next[`bot:${bot.id}`] || null,
      buildManagedBotStatusEmbed(bot),
      bot.id,
    );
    if (messageId) next[`bot:${bot.id}`] = messageId;
  }

  await prisma.botStatusConfig.update({
    where: { guildId },
    data: { messageId: siteMessageId, messageIds: next },
  });
  return { ok: true };
}

/** Actualise le tableau dans tous les serveurs où la fonctionnalité est activée. */
async function postStatusToAllGuilds(): Promise<void> {
  const configs = await prisma.botStatusConfig.findMany({
    where: { enabled: true, channelId: { not: null } },
  });
  for (const cfg of configs) {
    await publishStatusBoard(cfg.guildId);
  }
}

/** Démarre le rapport d'état automatique (toutes les 30 minutes). */
export function startStatusReports(): void {
  const THIRTY_MIN = 30 * 60 * 1000;
  postStatusToAllGuilds().catch((err) => console.error("[status] échec du rapport initial", err));
  setInterval(() => {
    postStatusToAllGuilds().catch((err) => console.error("[status] échec du rapport", err));
  }, THIRTY_MIN);
}
