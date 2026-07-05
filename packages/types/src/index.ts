// Types partagés entre le bot et le dashboard.

/** Structure d'un embed telle qu'éditée dans le builder et envoyée par le bot.
 *  Compatible avec discord.js EmbedBuilder / l'API REST Discord. */
export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // couleur décimale (0xRRGGBB)
  timestamp?: string; // ISO 8601
  author?: { name: string; url?: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string; icon_url?: string };
  fields?: EmbedField[];
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/** Payload envoyé par le dashboard à l'API interne du bot pour invalider le cache. */
export interface ReloadConfigPayload {
  guildId: string;
}

/** Un serveur retourné au dashboard : où l'utilisateur est admin ET Drivebot présent. */
export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
  botPresent: boolean;
}

/** Salons et rôles d'un serveur, exposés par le bot pour peupler les menus. */
export interface GuildChannelInfo {
  id: string;
  name: string;
}
export interface GuildRoleInfo {
  id: string;
  name: string;
  color: number;
}
export interface GuildMeta {
  name: string;
  icon: string | null;
  memberCount: number;
  channels: GuildChannelInfo[];
  roles: GuildRoleInfo[];
}
