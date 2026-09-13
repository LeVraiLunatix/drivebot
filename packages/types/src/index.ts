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
  categories: GuildChannelInfo[];
  forums?: GuildChannelInfo[];
  roles: GuildRoleInfo[];
}

/** État du process bot, exposé par l'API interne pour le dashboard. */
export interface BotStatus {
  online: boolean;
  pingMs: number;
  uptimeSeconds: number;
  guildCount: number;
  memoryMb: number;
  memberCount: number;
  dbOk: boolean;
  startedAt: string; // ISO 8601
}

export interface CommunityPublication {
  key: string;
  label: string;
  channelId: string;
  channelName: string;
  published: boolean;
  messageUrl: string | null;
  sender: string | null;
  embedCount: number;
  hasComponents: boolean;
  updatedAt: string | null;
}

export interface CommunityOverview {
  live: boolean;
  syncedAt: string;
  publications: CommunityPublication[];
  onboarding: {
    verifiedRole: string | null;
    unverifiedRole: string | null;
    rulesChannel: string | null;
    verificationChannel: string | null;
    checks: {
      newcomersRestricted: boolean;
      rulesVisibleBeforeVerification: boolean;
      verificationVisibleBeforeVerification: boolean;
      verificationHiddenAfterVerification: boolean;
    };
    ready: boolean;
  };
}
