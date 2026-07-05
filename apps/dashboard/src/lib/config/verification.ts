import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface VerificationFormData {
  enabled: boolean;
  channelId: string | null;
  verifiedRoleId: string | null;
  unverifiedRoleId: string | null;
  panelTitle: string;
  panelDescription: string;
  panelColor: number;
}

const DEFAULTS: VerificationFormData = {
  enabled: false,
  channelId: null,
  verifiedRoleId: null,
  unverifiedRoleId: null,
  panelTitle: "Vérification",
  panelDescription:
    "Clique sur le bouton puis recopie le code affiché pour accéder au serveur.",
  panelColor: 0x5865f2,
};

export async function loadVerificationConfig(
  guildId: string,
): Promise<VerificationFormData> {
  const c = await prisma.verificationConfig.findUnique({ where: { guildId } });
  if (!c) return DEFAULTS;
  return {
    enabled: c.enabled,
    channelId: c.channelId,
    verifiedRoleId: c.verifiedRoleId,
    unverifiedRoleId: c.unverifiedRoleId,
    panelTitle: c.panelTitle,
    panelDescription: c.panelDescription,
    panelColor: c.panelColor,
  };
}

export async function saveVerificationConfig(
  guildId: string,
  d: VerificationFormData,
): Promise<void> {
  await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });
  const data = {
    enabled: d.enabled,
    channelId: d.channelId,
    verifiedRoleId: d.verifiedRoleId,
    unverifiedRoleId: d.unverifiedRoleId,
    panelTitle: d.panelTitle.slice(0, 256) || "Vérification",
    panelDescription: d.panelDescription.slice(0, 2000),
    panelColor: d.panelColor,
  };
  await prisma.verificationConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });
  await triggerReload(guildId);
}
