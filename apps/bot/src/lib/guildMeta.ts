import { ChannelType } from "discord.js";
import { client } from "../client.js";

export interface GuildMeta {
  name: string;
  icon: string | null;
  channels: { id: string; name: string }[];
  roles: { id: string; name: string; color: number }[];
}

/** Nom, salons textuels et rôles d'un serveur, pour le dashboard.
 *  Renvoie null si le bot n'est pas (ou plus) dans ce serveur. */
export function getGuildMeta(guildId: string): GuildMeta | null {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  const channels = guild.channels.cache
    .filter(
      (c) =>
        c.type === ChannelType.GuildText ||
        c.type === ChannelType.GuildAnnouncement,
    )
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .map((c) => ({ id: c.id, name: c.name }));

  const roles = guild.roles.cache
    // On exclut @everyone et les rôles gérés par une intégration (bots, boosts).
    .filter((r) => r.id !== guild.id && !r.managed)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name, color: r.color }));

  return { name: guild.name, icon: guild.icon, channels, roles };
}
