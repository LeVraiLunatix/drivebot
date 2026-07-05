import { EmbedBuilder, type GuildMember, type PartialGuildMember } from "discord.js";
import { renderTemplate } from "./templates.js";

/** Bel embed de bienvenue : avatar, numéro de membre, date de création du compte. */
export function buildJoinEmbed(member: GuildMember, message: string): EmbedBuilder {
  const { guild, user } = member;
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
    .setTitle("🎉 Un nouveau membre nous rejoint !")
    .setDescription(renderTemplate(message, member))
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "👤 Membre", value: `<@${user.id}>`, inline: true },
      { name: "🔢 Position", value: `${guild.memberCount}ᵉ membre`, inline: true },
      { name: "📅 Compte créé", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: `ID : ${user.id}` })
    .setTimestamp();
}

/** Bel embed de départ. */
export function buildLeaveEmbed(
  member: GuildMember | PartialGuildMember,
  message: string,
): EmbedBuilder {
  const { guild, user } = member;
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
    .setTitle("👋 Un membre nous a quittés")
    .setDescription(renderTemplate(message, member as GuildMember))
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "👤 Membre", value: user.tag ?? `<@${user.id}>`, inline: true },
      { name: "👥 Membres restants", value: `${guild.memberCount}`, inline: true },
    )
    .setFooter({ text: `ID : ${user.id}` })
    .setTimestamp();
}
