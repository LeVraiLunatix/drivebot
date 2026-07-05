import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type GuildMember,
  type ModalSubmitInteraction,
} from "discord.js";
import { prisma, type VerificationConfig } from "@drivebot/database";
import { client } from "../client.js";

// Caractères non ambigus (pas de O/0, I/1).
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = (n = 5) =>
  Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

/** Panneau de vérification (embed + bouton). */
export function buildVerificationPanel(cfg: VerificationConfig) {
  const embed = new EmbedBuilder()
    .setTitle(cfg.panelTitle)
    .setDescription(cfg.panelDescription)
    .setColor(cfg.panelColor);
  const button = new ButtonBuilder()
    .setCustomId("verify:start")
    .setLabel("Se vérifier")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);
  return { embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)] };
}

export async function publishVerificationPanel(
  guildId: string,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = await prisma.verificationConfig.findUnique({ where: { guildId } });
  if (!cfg?.channelId) return { ok: false, error: "Salon de vérification non configuré." };
  const channel = client.guilds.cache.get(guildId)?.channels.cache.get(cfg.channelId);
  if (!(channel instanceof TextChannel)) return { ok: false, error: "Salon introuvable." };
  try {
    await channel.send(buildVerificationPanel(cfg));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de l'envoi." };
  }
}

/** Clic sur « Se vérifier » : ouvre un modal avec un code à recopier. */
export async function startVerification(interaction: ButtonInteraction): Promise<void> {
  const code = genCode();
  const modal = new ModalBuilder()
    .setCustomId(`verify:submit:${code}`)
    .setTitle("Vérification")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("code")
          .setLabel(`Recopie ce code : ${code}`)
          .setStyle(TextInputStyle.Short)
          .setMinLength(5)
          .setMaxLength(5)
          .setRequired(true),
      ),
    );
  await interaction.showModal(modal);
}

/** Soumission du modal : valide le code et donne le rôle vérifié. */
export async function submitVerification(interaction: ModalSubmitInteraction): Promise<void> {
  const expected = interaction.customId.split(":")[2] ?? "";
  const given = interaction.fields.getTextInputValue("code").trim().toUpperCase();
  const member = interaction.member as GuildMember | null;
  if (!interaction.guild || !member) return;

  if (given !== expected) {
    await interaction.reply({ content: "❌ Code incorrect. Reclique sur **Se vérifier** pour réessayer.", ephemeral: true });
    return;
  }

  const cfg = await prisma.verificationConfig.findUnique({ where: { guildId: interaction.guild.id } });
  if (!cfg?.enabled) {
    await interaction.reply({ content: "La vérification est désactivée.", ephemeral: true });
    return;
  }

  try {
    if (cfg.verifiedRoleId) {
      const role = interaction.guild.roles.cache.get(cfg.verifiedRoleId);
      if (role) await member.roles.add(role);
    }
    if (cfg.unverifiedRoleId && member.roles.cache.has(cfg.unverifiedRoleId)) {
      await member.roles.remove(cfg.unverifiedRoleId);
    }
    await interaction.reply({ content: "✅ Tu es vérifié ! Bienvenue 🎉", ephemeral: true });
  } catch {
    await interaction.reply({
      content: "❌ Impossible de te donner le rôle. Préviens un membre du staff (permissions du bot).",
      ephemeral: true,
    });
  }
}
