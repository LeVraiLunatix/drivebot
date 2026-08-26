import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface ProtectionFormData {
  antiSpamEnabled: boolean;
  spamMessageThreshold: number;
  spamIntervalSeconds: number;
  spamAction: "TIMEOUT" | "KICK";
  spamTimeoutMinutes: number;

  antiRaidEnabled: boolean;
  raidJoinThreshold: number;
  raidIntervalSeconds: number;
}

const DEFAULTS: ProtectionFormData = {
  antiSpamEnabled: false,
  spamMessageThreshold: 5,
  spamIntervalSeconds: 5,
  spamAction: "TIMEOUT",
  spamTimeoutMinutes: 10,
  antiRaidEnabled: false,
  raidJoinThreshold: 5,
  raidIntervalSeconds: 10,
};

export async function loadProtectionConfig(guildId: string): Promise<ProtectionFormData> {
  const c = await prisma.protectionConfig.findUnique({ where: { guildId } });
  if (!c) return DEFAULTS;
  return {
    antiSpamEnabled: c.antiSpamEnabled,
    spamMessageThreshold: c.spamMessageThreshold,
    spamIntervalSeconds: c.spamIntervalSeconds,
    spamAction: c.spamAction,
    spamTimeoutMinutes: c.spamTimeoutMinutes,
    antiRaidEnabled: c.antiRaidEnabled,
    raidJoinThreshold: c.raidJoinThreshold,
    raidIntervalSeconds: c.raidIntervalSeconds,
  };
}

export async function saveProtectionConfig(guildId: string, d: ProtectionFormData): Promise<void> {
  await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });

  const data = {
    antiSpamEnabled: d.antiSpamEnabled,
    spamMessageThreshold: Math.min(Math.max(d.spamMessageThreshold, 2), 30),
    spamIntervalSeconds: Math.min(Math.max(d.spamIntervalSeconds, 2), 60),
    spamAction: d.spamAction,
    spamTimeoutMinutes: Math.min(Math.max(d.spamTimeoutMinutes, 1), 1440),
    antiRaidEnabled: d.antiRaidEnabled,
    raidJoinThreshold: Math.min(Math.max(d.raidJoinThreshold, 2), 50),
    raidIntervalSeconds: Math.min(Math.max(d.raidIntervalSeconds, 2), 300),
  };

  await prisma.protectionConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });
  await triggerReload(guildId);
}
