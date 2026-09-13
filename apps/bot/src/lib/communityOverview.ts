import { ChannelType, PermissionFlagsBits, type Guild, type GuildBasedChannel, type Role } from "discord.js";
import { client } from "../client.js";
import { listManagedBotChannelMessages } from "./managedBots.js";

const PUBLICATIONS = [
  { key: "accueil officiel", label: "Accueil", channelId: "1518688570011811951" },
  { key: "règlement officiel", label: "Règlement", channelId: "1521281341407232172" },
  { key: "parti pris", label: "Parti pris", channelId: "1518716430340849795" },
  { key: "catalogue des outils", label: "Outils", channelId: "1548282792670924882" },
  { key: "liens officiels", label: "Liens officiels", channelId: "1523472991076225024" },
  { key: "documentation", label: "Documentation", channelId: "1518688646566252714" },
  { key: "faq", label: "FAQ", channelId: "1518688832772509776" },
  { key: "vérification", label: "Vérification", channelId: "1523469828403368008" },
  { key: "support tickets", label: "Support & tickets", channelId: "1518688820634320986" },
  { key: "notifications générales", label: "Notifications générales", channelId: "1523704000954896476" },
  { key: "suivre les outils", label: "Notifications des outils", channelId: "1523704000954896476" },
] as const;

const PUBLIC_CATEGORY_IDS = [
  "1518687859299844146",
  "1518687859299844147",
  "1518688909360500988",
  "1523469564921249864",
  "1548282797079265311",
  "1548282802355834931",
] as const;

function roleByName(guild: Guild, pattern: RegExp): Role | undefined {
  return guild.roles.cache.find((role) => !role.managed && pattern.test(role.name));
}

function allowsView(channel: GuildBasedChannel | undefined, role: Role | undefined): boolean {
  if (!channel || !role || !("permissionOverwrites" in channel)) return false;
  return channel.permissionOverwrites.cache.get(role.id)?.allow.has(PermissionFlagsBits.ViewChannel) ?? false;
}

function deniesView(channel: GuildBasedChannel | undefined, role: Role | undefined): boolean {
  if (!channel || !role || !("permissionOverwrites" in channel)) return false;
  return channel.permissionOverwrites.cache.get(role.id)?.deny.has(PermissionFlagsBits.ViewChannel) ?? false;
}

export async function getCommunityOverview(guildId: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  const publications = await Promise.all(PUBLICATIONS.map(async (definition) => {
    const channel = guild.channels.cache.get(definition.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return { ...definition, channelName: "Salon introuvable", published: false, messageUrl: null, sender: null, embedCount: 0, hasComponents: false, updatedAt: null };
    }
    try {
      const messages = await listManagedBotChannelMessages("CordBot", guildId, definition.channelId);
      const marker = `Cordsuite • ${definition.key}`;
      const message = messages.find((entry) => entry.embeds.some((item) => item.footer?.text === marker));
      return {
        ...definition,
        channelName: channel.name,
        published: Boolean(message),
        messageUrl: message ? `https://discord.com/channels/${guildId}/${definition.channelId}/${message.id}` : null,
        sender: message?.author.username ?? null,
        embedCount: message?.embeds.length ?? 0,
        hasComponents: Boolean(message?.components?.length),
        updatedAt: message?.edited_timestamp ?? message?.timestamp ?? null,
      };
    } catch {
      return { ...definition, channelName: channel.name, published: false, messageUrl: null, sender: null, embedCount: 0, hasComponents: false, updatedAt: null };
    }
  }));

  const verifiedRole = roleByName(guild, /membres? v.rifi/i);
  const unverifiedRole = roleByName(guild, /non v.rifi/i);
  const rulesChannel = guild.channels.cache.get("1521281341407232172");
  const verificationChannel = guild.channels.cache.get("1523469828403368008");
  const categories = PUBLIC_CATEGORY_IDS.map((id) => guild.channels.cache.get(id));
  const checks = {
    newcomersRestricted: categories.every((category) => deniesView(category, unverifiedRole)),
    rulesVisibleBeforeVerification: allowsView(rulesChannel, unverifiedRole),
    verificationVisibleBeforeVerification: allowsView(verificationChannel, unverifiedRole),
    verificationHiddenAfterVerification: deniesView(verificationChannel, verifiedRole),
  };

  return {
    live: true,
    syncedAt: new Date().toISOString(),
    publications,
    onboarding: {
      verifiedRole: verifiedRole?.name ?? null,
      unverifiedRole: unverifiedRole?.name ?? null,
      rulesChannel: rulesChannel?.name ?? null,
      verificationChannel: verificationChannel?.name ?? null,
      checks,
      ready: Object.values(checks).every(Boolean),
    },
  };
}
