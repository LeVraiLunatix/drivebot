import type { GuildMember } from "discord.js";
import { getGuildConfig } from "./guildConfig.js";
import { sendAsManagedBot } from "./managedBots.js";
import { buildJoinEmbed } from "./welcomeEmbed.js";

/** Publie la bienvenue avec le bot et le modèle choisis dans le dashboard. */
export async function sendWelcomeMessage(member: GuildMember): Promise<boolean> {
  const cfg = await getGuildConfig(member.guild.id);
  const welcome = cfg.welcome;
  if (!welcome?.joinEnabled || !welcome.joinChannel) return false;

  const channel = member.guild.channels.cache.get(welcome.joinChannel);
  if (!channel?.isTextBased()) return false;

  await sendAsManagedBot(welcome.botId, member.guild.id, welcome.joinChannel, {
    content: `<@${member.id}>`,
    embeds: [buildJoinEmbed(member, welcome.joinMessage).toJSON()],
  });
  return true;
}
