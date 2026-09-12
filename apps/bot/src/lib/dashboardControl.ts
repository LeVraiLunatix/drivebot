import { PermissionFlagsBits } from "discord.js";
import { client } from "../client.js";
import { recordCase } from "./modlog.js";
import { managedBotInventory } from "./managedBots.js";

export async function listGuildBots(guildId: string) {
  return managedBotInventory(guildId);
}

export async function moderateFromDashboard(guildId: string, body: unknown) {
  const data = body as Record<string, unknown> | null;
  const action = data?.action;
  const targetId = data?.targetId;
  const reason = typeof data?.reason === "string" ? data.reason.trim() : "";
  if (!["WARN", "KICK", "BAN", "UNBAN", "TIMEOUT"].includes(String(action)) ||
      typeof targetId !== "string" || !/^\d{17,20}$/.test(targetId) || !reason || reason.length > 400) {
    return { ok: false, error: "Action, identifiant Discord et raison (1 à 400 caractères) requis." };
  }
  const minutes = data?.minutes;
  if (action === "TIMEOUT" && (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 40320)) {
    return { ok: false, error: "Durée invalide : de 1 à 40 320 minutes." };
  }
  const guild = client.guilds.cache.get(guildId);
  if (!guild || !client.isReady()) return { ok: false, error: "Serveur indisponible." };
  if (targetId === guild.ownerId || targetId === client.user?.id) return { ok: false, error: "Cette cible est protégée." };
  const me = await guild.members.fetchMe();
  const permission = action === "KICK" ? PermissionFlagsBits.KickMembers
    : action === "BAN" || action === "UNBAN" ? PermissionFlagsBits.BanMembers : PermissionFlagsBits.ModerateMembers;
  if (!me.permissions.has(permission)) return { ok: false, error: "Drivebot ne possède pas la permission Discord nécessaire." };
  const auditReason = `Dashboard propriétaire : ${reason}`;
  let targetTag = targetId;
  let member;
  if (action === "UNBAN") {
    await guild.bans.remove(targetId, auditReason);
  } else {
    member = await guild.members.fetch(targetId);
    targetTag = member.user.tag;
    if (member.user.bot || me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return { ok: false, error: "Cible protégée ou rôle supérieur à celui de Drivebot." };
    }
    if (action === "KICK") {
      if (!member.kickable) return { ok: false, error: "Ce membre ne peut pas être expulsé." };
      await member.kick(auditReason);
    } else if (action === "BAN") {
      if (!member.bannable) return { ok: false, error: "Ce membre ne peut pas être banni." };
      await member.ban({ reason: auditReason });
    } else if (action === "TIMEOUT") {
      if (!member.moderatable) return { ok: false, error: "Ce membre ne peut pas être exclu temporairement." };
      await member.timeout((minutes as number) * 60_000, auditReason);
    }
  }
  try {
    await recordCase({ guild, type: action as "WARN" | "KICK" | "BAN" | "UNBAN" | "TIMEOUT",
      targetUserId: targetId, targetTag, moderatorId: "dashboard-owner", reason: auditReason });
  } catch {
    return { ok: action !== "WARN", error: action === "WARN" ? "Impossible d'enregistrer l'avertissement."
      : "Action Discord effectuée, mais historique indisponible. Ne relance pas l'action." };
  }
  if (action === "WARN" && member) {
    const delivered = await member.send({ content: `⚠️ Avertissement sur **${guild.name}** : ${reason}`, allowedMentions: { parse: [] } }).then(() => true, () => false);
    if (!delivered) return { ok: true, error: "Avertissement enregistré ; message privé non distribué." };
  }
  return { ok: true };
}
