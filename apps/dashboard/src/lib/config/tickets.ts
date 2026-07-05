import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface TicketsFormData {
  enabled: boolean;
  panelChannel: string | null;
  categoryId: string | null;
  logChannel: string | null;
  staffRoleIds: string[];
  pingRoleId: string | null;
  panelTitle: string;
  panelDescription: string;
  panelColor: number;
  buttonLabel: string;
  buttonEmoji: string;
  openMessage: string;
  maxOpen: number;
}

const DEFAULTS: TicketsFormData = {
  enabled: false,
  panelChannel: null,
  categoryId: null,
  logChannel: null,
  staffRoleIds: [],
  pingRoleId: null,
  panelTitle: "Support",
  panelDescription:
    "Besoin d'aide ? Clique sur le bouton ci-dessous pour ouvrir un ticket.",
  panelColor: 0x5865f2,
  buttonLabel: "Ouvrir un ticket",
  buttonEmoji: "🎫",
  openMessage: "Bonjour {user}, décris ta demande. Un membre du staff va te répondre.",
  maxOpen: 1,
};

export async function loadTicketsConfig(guildId: string): Promise<TicketsFormData> {
  const c = await prisma.ticketConfig.findUnique({ where: { guildId } });
  if (!c) return DEFAULTS;
  return {
    enabled: c.enabled,
    panelChannel: c.panelChannel,
    categoryId: c.categoryId,
    logChannel: c.logChannel,
    staffRoleIds: c.staffRoleIds,
    pingRoleId: c.pingRoleId,
    panelTitle: c.panelTitle,
    panelDescription: c.panelDescription,
    panelColor: c.panelColor,
    buttonLabel: c.buttonLabel,
    buttonEmoji: c.buttonEmoji,
    openMessage: c.openMessage,
    maxOpen: c.maxOpen,
  };
}

export async function saveTicketsConfig(
  guildId: string,
  d: TicketsFormData,
): Promise<void> {
  await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });

  const data = {
    enabled: d.enabled,
    panelChannel: d.panelChannel,
    categoryId: d.categoryId,
    logChannel: d.logChannel,
    staffRoleIds: d.staffRoleIds,
    pingRoleId: d.pingRoleId,
    panelTitle: d.panelTitle.slice(0, 256) || "Support",
    panelDescription: d.panelDescription.slice(0, 2000),
    panelColor: d.panelColor,
    buttonLabel: d.buttonLabel.slice(0, 80) || "Ouvrir un ticket",
    buttonEmoji: d.buttonEmoji.slice(0, 8),
    openMessage: d.openMessage.slice(0, 2000),
    maxOpen: Math.min(Math.max(d.maxOpen, 1), 10),
  };

  await prisma.ticketConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });
  await triggerReload(guildId);
}
