import type { GuildMember } from "discord.js";

/** Remplace les variables d'un message configuré dans le dashboard.
 *  Variables : {user} (mention), {username}, {server}, {memberCount}. */
export function renderTemplate(template: string, member: GuildMember): string {
  return template
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{username}", member.user.username)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{memberCount}", String(member.guild.memberCount));
}
