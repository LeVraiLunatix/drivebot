import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface ModerationFormData {
  logEnabled: boolean;
  logChannel: string | null;
}

export async function loadModerationConfig(
  guildId: string,
): Promise<ModerationFormData> {
  const cfg = await prisma.moderationConfig.findUnique({ where: { guildId } });
  return {
    logEnabled: cfg?.logEnabled ?? false,
    logChannel: cfg?.logChannel ?? null,
  };
}

export async function saveModerationConfig(
  guildId: string,
  data: ModerationFormData,
): Promise<void> {
  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId },
    update: {},
  });
  await prisma.moderationConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });
  await triggerReload(guildId);
}

/** Dernières sanctions enregistrées, pour affichage dans le dashboard. */
export async function recentCases(guildId: string, take = 10) {
  return prisma.moderationCase.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
