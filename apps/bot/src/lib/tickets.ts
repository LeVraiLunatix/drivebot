import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  type ButtonInteraction,
  type GuildMember,
} from "discord.js";
import { prisma, type TicketConfig } from "@drivebot/database";
import { client } from "../client.js";
import { renderTemplate } from "./templates.js";

/** Panneau (embed + bouton d'ouverture) affiché dans le salon public. */
export function buildTicketPanel(cfg: TicketConfig) {
  const embed = new EmbedBuilder()
    .setTitle(cfg.panelTitle)
    .setDescription(cfg.panelDescription)
    .setColor(cfg.panelColor);

  const button = new ButtonBuilder()
    .setCustomId("ticket:open")
    .setLabel(cfg.buttonLabel)
    .setStyle(ButtonStyle.Primary);
  if (cfg.buttonEmoji) button.setEmoji(cfg.buttonEmoji);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
  };
}

/** Publie/republie le panneau dans le salon configuré. Appelé par le dashboard. */
export async function publishTicketPanel(
  guildId: string,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = await prisma.ticketConfig.findUnique({ where: { guildId } });
  if (!cfg?.panelChannel) return { ok: false, error: "Salon du panneau non configuré." };

  const guild = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(cfg.panelChannel);
  if (!(channel instanceof TextChannel)) return { ok: false, error: "Salon introuvable." };

  try {
    await channel.send(buildTicketPanel(cfg));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de l'envoi." };
  }
}

async function logTicket(cfg: TicketConfig, guildId: string, text: string) {
  if (!cfg.logChannel) return;
  const ch = client.guilds.cache.get(guildId)?.channels.cache.get(cfg.logChannel);
  if (ch instanceof TextChannel) {
    await ch.send({ embeds: [new EmbedBuilder().setDescription(text).setColor(cfg.panelColor).setTimestamp()] }).catch(() => {});
  }
}

function isStaff(member: GuildMember, cfg: TicketConfig): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.roles.cache.some((r) => cfg.staffRoleIds.includes(r.id))
  );
}

/** Crée un salon de ticket privé pour l'utilisateur qui clique sur le panneau. */
export async function openTicket(interaction: ButtonInteraction): Promise<void> {
  const guild = interaction.guild;
  const member = interaction.member as GuildMember | null;
  if (!guild || !member) return;

  const cfg = await prisma.ticketConfig.findUnique({ where: { guildId: guild.id } });
  if (!cfg?.enabled) {
    await interaction.reply({ content: "Le système de tickets est désactivé.", ephemeral: true });
    return;
  }

  const openCount = await prisma.ticket.count({
    where: { guildId: guild.id, userId: interaction.user.id, status: "OPEN" },
  });
  if (openCount >= cfg.maxOpen) {
    await interaction.reply({ content: `Tu as déjà ${cfg.maxOpen} ticket(s) ouvert(s).`, ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  // Numéro de ticket (incrément atomique).
  const { counter } = await prisma.ticketConfig.update({
    where: { guildId: guild.id },
    data: { counter: { increment: 1 } },
    select: { counter: true },
  });

  const allow = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AttachFiles,
  ];

  try {
    const channel = await guild.channels.create({
      name: `ticket-${String(counter).padStart(4, "0")}`,
      type: ChannelType.GuildText,
      parent: cfg.categoryId ?? undefined,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow },
        { id: client.user!.id, allow: [...allow, PermissionFlagsBits.ManageChannels] },
        ...cfg.staffRoleIds.map((id) => ({ id, allow })),
      ],
    });

    await prisma.ticket.create({
      data: { guildId: guild.id, number: counter, channelId: channel.id, userId: interaction.user.id },
    });

    const embed = new EmbedBuilder()
      .setTitle(`Ticket #${counter}`)
      .setDescription(renderTemplate(cfg.openMessage, member))
      .setColor(cfg.panelColor);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ticket:claim").setLabel("Prendre en charge").setStyle(ButtonStyle.Secondary).setEmoji("🙋"),
      new ButtonBuilder().setCustomId("ticket:close").setLabel("Fermer").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
    );

    const ping = cfg.pingRoleId ? `<@&${cfg.pingRoleId}> ` : "";
    await channel.send({ content: `${ping}<@${interaction.user.id}>`, embeds: [embed], components: [row] });
    await logTicket(cfg, guild.id, `🎫 Ticket **#${counter}** ouvert par <@${interaction.user.id}>`);

    await interaction.editReply({ content: `✅ Ton ticket a été créé : ${channel}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erreur";
    await interaction.editReply({
      content: `❌ Impossible de créer le ticket (${msg}). Vérifie que Drivebot a la permission **Gérer les salons**.`,
    });
  }
}

/** Prend en charge un ticket (staff). */
export async function claimTicket(interaction: ButtonInteraction): Promise<void> {
  const member = interaction.member as GuildMember | null;
  const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId ?? "" } });
  const cfg = ticket && (await prisma.ticketConfig.findUnique({ where: { guildId: ticket.guildId } }));
  if (!ticket || !cfg || !member) return;

  if (!isStaff(member, cfg)) {
    await interaction.reply({ content: "Réservé au staff.", ephemeral: true });
    return;
  }
  await prisma.ticket.update({ where: { id: ticket.id }, data: { claimedBy: interaction.user.id } });
  await interaction.reply({ content: `🙋 <@${interaction.user.id}> prend en charge ce ticket.` });
  await logTicket(cfg, ticket.guildId, `🙋 Ticket **#${ticket.number}** pris par <@${interaction.user.id}>`);
}

/** Ferme et supprime le salon du ticket. */
export async function closeTicket(interaction: ButtonInteraction): Promise<void> {
  const member = interaction.member as GuildMember | null;
  const ticket = await prisma.ticket.findUnique({ where: { channelId: interaction.channelId ?? "" } });
  const cfg = ticket && (await prisma.ticketConfig.findUnique({ where: { guildId: ticket.guildId } }));
  if (!ticket || !cfg || !member) return;
  if (ticket.status === "CLOSED") return;

  const allowed = isStaff(member, cfg) || interaction.user.id === ticket.userId;
  if (!allowed) {
    await interaction.reply({ content: "Tu ne peux pas fermer ce ticket.", ephemeral: true });
    return;
  }

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "CLOSED", closedAt: new Date() } });
  await interaction.reply({ content: "🔒 Ticket fermé. Le salon sera supprimé dans 5 secondes." });
  await logTicket(cfg, ticket.guildId, `🔒 Ticket **#${ticket.number}** fermé par <@${interaction.user.id}>`);

  setTimeout(() => {
    interaction.channel?.delete().catch(() => {});
  }, 5000);
}
