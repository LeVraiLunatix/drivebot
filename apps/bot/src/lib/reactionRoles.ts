import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { prisma, type ReactionRolePanel, type ReactionRoleOption } from "@drivebot/database";
import { client } from "../client.js";

type PanelWithRoles = ReactionRolePanel & { roles: ReactionRoleOption[] };

const MAX_BUTTONS_PER_ROW = 5;

/** Panneau (embed + boutons rôles, 5 par ligne) affiché dans le salon public. */
export function buildReactionRolePanel(panel: PanelWithRoles) {
  const embed = new EmbedBuilder()
    .setTitle(panel.title)
    .setDescription(panel.description)
    .setColor(panel.color);

  const sorted = [...panel.roles].sort((a, b) => a.position - b.position);
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < sorted.length; i += MAX_BUTTONS_PER_ROW) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const opt of sorted.slice(i, i + MAX_BUTTONS_PER_ROW)) {
      const button = new ButtonBuilder()
        .setCustomId(`selfrole:${panel.id}:${opt.roleId}`)
        .setLabel(opt.label)
        .setStyle(ButtonStyle.Secondary);
      if (opt.emoji) button.setEmoji(opt.emoji);
      row.addComponents(button);
    }
    rows.push(row);
  }

  return { embeds: [embed], components: rows };
}

/** Publie ou met à jour (édite) le panneau dans le salon configuré. Appelé par le dashboard. */
export async function publishReactionRolePanel(
  guildId: string,
  panelId: string,
): Promise<{ ok: boolean; error?: string }> {
  const panel = await prisma.reactionRolePanel.findUnique({
    where: { id: panelId },
    include: { roles: true },
  });
  if (!panel || panel.guildId !== guildId) return { ok: false, error: "Panneau introuvable." };
  if (!panel.channelId) return { ok: false, error: "Salon non configuré." };
  if (panel.roles.length === 0) return { ok: false, error: "Ajoute au moins un rôle." };

  const guild = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(panel.channelId);
  if (!(channel instanceof TextChannel)) return { ok: false, error: "Salon introuvable." };

  const payload = buildReactionRolePanel(panel);

  try {
    if (panel.messageId) {
      const existing = await channel.messages.fetch(panel.messageId).catch(() => null);
      if (existing) {
        await existing.edit(payload);
        return { ok: true };
      }
    }
    const sent = await channel.send(payload);
    await prisma.reactionRolePanel.update({ where: { id: panelId }, data: { messageId: sent.id } });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de l'envoi." };
  }
}
