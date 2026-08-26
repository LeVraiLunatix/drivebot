import { type GuildMember, type Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { client } from "../client.js";
import { getGuildConfig } from "./guildConfig.js";
import { recordCase } from "./modlog.js";

interface TrackedMessage {
  id: string;
  channelId: string;
  ts: number;
}
/** Messages récents par membre (clé "guildId:userId"), fenêtre glissante. */
const spamTracker = new Map<string, TrackedMessage[]>();

interface TrackedJoin {
  id: string;
  ts: number;
}
/** Arrivées récentes par serveur (clé guildId), fenêtre glissante. */
const raidTracker = new Map<string, TrackedJoin[]>();

/** Anti-spam : au-delà du seuil de messages sur la fenêtre configurée, supprime
 *  les messages repérés et sanctionne le membre (timeout ou kick). */
export async function checkSpam(message: Message): Promise<void> {
  if (message.author.bot || !message.guild || !message.member) return;
  if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const cfg = await getGuildConfig(message.guild.id);
  const p = cfg.protection;
  if (!p?.antiSpamEnabled) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const windowMs = p.spamIntervalSeconds * 1000;
  const list = (spamTracker.get(key) ?? []).filter((m) => now - m.ts < windowMs);
  list.push({ id: message.id, channelId: message.channelId, ts: now });

  if (list.length <= p.spamMessageThreshold) {
    spamTracker.set(key, list);
    return;
  }
  spamTracker.delete(key);

  const byChannel = new Map<string, string[]>();
  for (const m of list) byChannel.set(m.channelId, [...(byChannel.get(m.channelId) ?? []), m.id]);
  for (const [channelId, ids] of byChannel) {
    const channel = message.guild.channels.cache.get(channelId);
    if (channel instanceof TextChannel) await channel.bulkDelete(ids, true).catch(() => {});
  }

  const member = message.member;
  const reason = `Anti-spam automatique (${list.length} messages en ${p.spamIntervalSeconds}s)`;

  try {
    if (p.spamAction === "KICK") {
      if (!member.kickable) return;
      await member.kick(reason);
      await recordCase({
        guild: message.guild,
        type: "KICK",
        targetUserId: member.id,
        targetTag: member.user.tag,
        moderatorId: client.user!.id,
        reason,
      });
    } else {
      if (!member.moderatable) return;
      await member.timeout(p.spamTimeoutMinutes * 60_000, reason);
      await recordCase({
        guild: message.guild,
        type: "TIMEOUT",
        targetUserId: member.id,
        targetTag: member.user.tag,
        moderatorId: client.user!.id,
        reason,
      });
    }
  } catch (e) {
    console.warn("[protection] sanction anti-spam échouée:", (e as Error).message);
  }
}

/** Anti-raid : au-delà du seuil d'arrivées sur la fenêtre configurée, expulse
 *  tous les membres repérés dans la rafale. */
export async function checkRaid(member: GuildMember): Promise<void> {
  const cfg = await getGuildConfig(member.guild.id);
  const p = cfg.protection;
  if (!p?.antiRaidEnabled) return;

  const key = member.guild.id;
  const now = Date.now();
  const windowMs = p.raidIntervalSeconds * 1000;
  const list = (raidTracker.get(key) ?? []).filter((j) => now - j.ts < windowMs);
  list.push({ id: member.id, ts: now });

  if (list.length < p.raidJoinThreshold) {
    raidTracker.set(key, list);
    return;
  }
  raidTracker.delete(key);

  const reason = `Anti-raid automatique (${list.length} arrivées en ${p.raidIntervalSeconds}s)`;
  for (const j of list) {
    const target = member.guild.members.cache.get(j.id);
    if (!target?.kickable) continue;
    try {
      await target.kick(reason);
      await recordCase({
        guild: member.guild,
        type: "KICK",
        targetUserId: target.id,
        targetTag: target.user.tag,
        moderatorId: client.user!.id,
        reason,
      });
    } catch (e) {
      console.warn("[protection] expulsion anti-raid échouée:", (e as Error).message);
    }
  }
}
