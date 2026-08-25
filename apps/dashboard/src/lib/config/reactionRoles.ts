import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface ReactionRoleOptionData {
  roleId: string;
  label: string;
  emoji: string;
}

export interface ReactionRolePanelFormData {
  id: string;
  channelId: string | null;
  messageId: string | null;
  title: string;
  description: string;
  color: number;
  multiple: boolean;
  roles: ReactionRoleOptionData[];
}

const DEFAULTS: Omit<ReactionRolePanelFormData, "id" | "messageId"> = {
  channelId: null,
  title: "Rôles",
  description: "Clique sur un bouton pour obtenir ou retirer un rôle.",
  color: 0x5865f2,
  multiple: true,
  roles: [],
};

export async function loadPanels(guildId: string): Promise<ReactionRolePanelFormData[]> {
  const panels = await prisma.reactionRolePanel.findMany({
    where: { guildId },
    include: { roles: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return panels.map((p) => ({
    id: p.id,
    channelId: p.channelId,
    messageId: p.messageId,
    title: p.title,
    description: p.description,
    color: p.color,
    multiple: p.multiple,
    roles: p.roles.map((r) => ({ roleId: r.roleId, label: r.label, emoji: r.emoji ?? "" })),
  }));
}

/** Crée un panneau vide et renvoie ses données par défaut (pour l'ajouter côté client). */
export async function createPanel(guildId: string): Promise<ReactionRolePanelFormData> {
  await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });
  const panel = await prisma.reactionRolePanel.create({ data: { guildId } });
  return { id: panel.id, messageId: null, ...DEFAULTS };
}

export async function savePanel(
  guildId: string,
  panelId: string,
  d: ReactionRolePanelFormData,
): Promise<void> {
  const roles = d.roles.filter((r) => r.roleId).slice(0, 25);

  await prisma.$transaction([
    prisma.reactionRolePanel.update({
      where: { id: panelId },
      data: {
        channelId: d.channelId,
        title: d.title.slice(0, 256) || "Rôles",
        description: d.description.slice(0, 2000),
        color: d.color,
        multiple: d.multiple,
      },
    }),
    prisma.reactionRoleOption.deleteMany({ where: { panelId } }),
    ...(roles.length
      ? [
          prisma.reactionRoleOption.createMany({
            data: roles.map((r, i) => ({
              panelId,
              roleId: r.roleId,
              label: (r.label.trim() || "Rôle").slice(0, 80),
              emoji: r.emoji.trim().slice(0, 8) || null,
              position: i,
            })),
          }),
        ]
      : []),
  ]);
  await triggerReload(guildId);
}

export async function deletePanel(guildId: string, panelId: string): Promise<void> {
  await prisma.reactionRolePanel.delete({ where: { id: panelId, guildId } });
  await triggerReload(guildId);
}
