import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface SettingsFormData {
  locale: "FR" | "EN";
  prefix: string;
}

export async function loadSettings(guildId: string): Promise<SettingsFormData> {
  const g = await prisma.guild.findUnique({ where: { id: guildId } });
  return {
    locale: (g?.locale as "FR" | "EN") ?? "FR",
    prefix: g?.prefix ?? "!",
  };
}

export async function saveSettings(
  guildId: string,
  data: SettingsFormData,
): Promise<void> {
  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, locale: data.locale, prefix: data.prefix },
    update: { locale: data.locale, prefix: data.prefix },
  });
  await triggerReload(guildId);
}
