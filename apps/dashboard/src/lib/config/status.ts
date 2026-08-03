import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface StatusFormData {
  enabled: boolean;
  channelId: string | null;
}

export async function loadStatusConfig(guildId: string): Promise<StatusFormData> {
  const cfg = await prisma.botStatusConfig.findUnique({ where: { guildId } });
  return {
    enabled: cfg?.enabled ?? false,
    channelId: cfg?.channelId ?? null,
  };
}

export async function saveStatusConfig(
  guildId: string,
  data: StatusFormData,
): Promise<void> {
  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId },
    update: {},
  });
  await prisma.botStatusConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });
  await triggerReload(guildId);
}
