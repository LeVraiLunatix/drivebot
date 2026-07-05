import {
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "./types.js";
import { recordCase } from "../lib/modlog.js";

function target(interaction: Parameters<Command["execute"]>[0]): GuildMember | null {
  const m = interaction.options.getMember("membre");
  return m instanceof GuildMember ? m : null;
}

export const kick: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulse un membre du serveur.")
    .addUserOption((o) => o.setName("membre").setDescription("Membre à expulser").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const member = target(interaction);
    const reason = interaction.options.getString("raison");
    if (!interaction.guild || !member) {
      await interaction.reply({ content: "Membre introuvable.", ephemeral: true });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({ content: "Je ne peux pas expulser ce membre.", ephemeral: true });
      return;
    }
    await member.kick(reason ?? undefined);
    await recordCase({
      guild: interaction.guild,
      type: "KICK",
      targetUserId: member.id,
      targetTag: member.user.tag,
      moderatorId: interaction.user.id,
      reason,
    });
    await interaction.reply({ content: `✅ ${member.user.tag} a été expulsé.`, ephemeral: true });
  },
};

export const ban: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bannit un membre du serveur.")
    .addUserOption((o) => o.setName("membre").setDescription("Membre à bannir").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const member = target(interaction);
    const reason = interaction.options.getString("raison");
    if (!interaction.guild || !member) {
      await interaction.reply({ content: "Membre introuvable.", ephemeral: true });
      return;
    }
    if (!member.bannable) {
      await interaction.reply({ content: "Je ne peux pas bannir ce membre.", ephemeral: true });
      return;
    }
    await member.ban({ reason: reason ?? undefined });
    await recordCase({
      guild: interaction.guild,
      type: "BAN",
      targetUserId: member.id,
      targetTag: member.user.tag,
      moderatorId: interaction.user.id,
      reason,
    });
    await interaction.reply({ content: `✅ ${member.user.tag} a été banni.`, ephemeral: true });
  },
};

export const timeout: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Exclut temporairement un membre (timeout).")
    .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    .addIntegerOption((o) =>
      o.setName("minutes").setDescription("Durée en minutes").setRequired(true).setMinValue(1).setMaxValue(40320),
    )
    .addStringOption((o) => o.setName("raison").setDescription("Raison"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const member = target(interaction);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("raison");
    if (!interaction.guild || !member) {
      await interaction.reply({ content: "Membre introuvable.", ephemeral: true });
      return;
    }
    if (!member.moderatable) {
      await interaction.reply({ content: "Je ne peux pas exclure ce membre.", ephemeral: true });
      return;
    }
    await member.timeout(minutes * 60_000, reason ?? undefined);
    await recordCase({
      guild: interaction.guild,
      type: "TIMEOUT",
      targetUserId: member.id,
      targetTag: member.user.tag,
      moderatorId: interaction.user.id,
      reason,
    });
    await interaction.reply({ content: `✅ ${member.user.tag} exclu ${minutes} min.`, ephemeral: true });
  },
};

export const warn: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Avertit un membre.")
    .addUserOption((o) => o.setName("membre").setDescription("Membre").setRequired(true))
    .addStringOption((o) => o.setName("raison").setDescription("Raison").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const member = target(interaction);
    const reason = interaction.options.getString("raison", true);
    if (!interaction.guild || !member) {
      await interaction.reply({ content: "Membre introuvable.", ephemeral: true });
      return;
    }
    await recordCase({
      guild: interaction.guild,
      type: "WARN",
      targetUserId: member.id,
      targetTag: member.user.tag,
      moderatorId: interaction.user.id,
      reason,
    });
    await member.send(`⚠️ Tu as reçu un avertissement sur **${interaction.guild.name}** : ${reason}`).catch(() => {});
    await interaction.reply({ content: `✅ ${member.user.tag} a été averti.`, ephemeral: true });
  },
};
