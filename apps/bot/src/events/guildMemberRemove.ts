import { type GuildMember, type PartialGuildMember, TextChannel } from "discord.js";
import { getGuildConfig } from "../lib/guildConfig.js";
import { renderTemplate } from "../lib/templates.js";

/** Au départ d'un membre : message de départ si configuré. */
export async function onGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  const cfg = await getGuildConfig(member.guild.id);
  const w = cfg.welcome;
  if (!w?.leaveEnabled || !w.leaveChannel) return;

  const channel = member.guild.channels.cache.get(w.leaveChannel);
  if (!(channel instanceof TextChannel)) return;

  // member peut être partiel ; renderTemplate ne lit que des champs simples.
  await channel
    .send(renderTemplate(w.leaveMessage, member as GuildMember))
    .catch(() => {});
}
