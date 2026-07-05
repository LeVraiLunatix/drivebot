import { EmbedBuilder, type Guild, TextChannel } from "discord.js";
import { prisma, type ModerationAction } from "@drivebot/database";
import { getGuildConfig } from "./guildConfig.js";

const COLORS: Record<ModerationAction, number> = {
  WARN: 0xf1c40f,
  KICK: 0xe67e22,
  BAN: 0xe74c3c,
  UNBAN: 0x2ecc71,
  TIMEOUT: 0x9b59b6,
};

const LABELS: Record<ModerationAction, string> = {
  WARN: "Avertissement",
  KICK: "Expulsion",
  BAN: "Bannissement",
  UNBAN: "Débannissement",
  TIMEOUT: "Exclusion temporaire",
};

/** Enregistre une sanction en base et la poste dans le salon de logs si activé. */
export async function recordCase(params: {
  guild: Guild;
  type: ModerationAction;
  targetUserId: string;
  targetTag: string;
  moderatorId: string;
  reason: string | null;
}): Promise<void> {
  const { guild, type, targetUserId, targetTag, moderatorId, reason } = params;

  await prisma.moderationCase.create({
    data: { guildId: guild.id, type, targetUserId, moderatorId, reason },
  });

  const cfg = await getGuildConfig(guild.id);
  const mod = cfg.moderationCfg;
  if (!mod?.logEnabled || !mod.logChannel) return;

  const channel = guild.channels.cache.get(mod.logChannel);
  if (!(channel instanceof TextChannel)) return;

  const embed = new EmbedBuilder()
    .setColor(COLORS[type])
    .setTitle(LABELS[type])
    .addFields(
      { name: "Membre", value: `${targetTag} (${targetUserId})` },
      { name: "Modérateur", value: `<@${moderatorId}>` },
      { name: "Raison", value: reason || "Aucune raison fournie" },
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
}
