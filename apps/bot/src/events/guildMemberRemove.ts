import { type GuildMember, type PartialGuildMember } from "discord.js";
import { getGuildConfig } from "../lib/guildConfig.js";
import { buildLeaveEmbed } from "../lib/welcomeEmbed.js";
import { sendAsManagedBot } from "../lib/managedBots.js";

/** Au départ d'un membre : embed de départ si configuré. */
export async function onGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  const cfg = await getGuildConfig(member.guild.id);
  const w = cfg.welcome;
  if (!w?.leaveEnabled || !w.leaveChannel) return;

  const channel = member.guild.channels.cache.get(w.leaveChannel);
  if (!channel?.isTextBased()) return;

  await sendAsManagedBot(w.botId, member.guild.id, w.leaveChannel, { embeds: [buildLeaveEmbed(member, w.leaveMessage).toJSON()] }).catch(() => {});
}
