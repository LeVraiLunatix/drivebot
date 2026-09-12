import { type GuildMember } from "discord.js";
import { getGuildConfig } from "../lib/guildConfig.js";
import { buildJoinEmbed } from "../lib/welcomeEmbed.js";
import { checkRaid } from "../lib/protection.js";
import { sendAsManagedBot } from "../lib/managedBots.js";

/** À l'arrivée : anti-raid, rôle non-vérifié (si vérif active), autorôles, embed de bienvenue. */
export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  await checkRaid(member).catch((e) => console.error("[protection] checkRaid:", e));

  const cfg = await getGuildConfig(member.guild.id);

  // Rôle « non vérifié » si le système de vérification est actif.
  const v = cfg.verification;
  if (v?.enabled && v.unverifiedRoleId) {
    const role = member.guild.roles.cache.get(v.unverifiedRoleId);
    if (role) await member.roles.add(role).catch(() => {});
  }

  // Autorôles.
  for (const { roleId } of cfg.autoRoles) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role).catch((e) => {
        console.warn(`[autorole] échec ${roleId} sur ${member.id}:`, e.message);
      });
    }
  }

  // Embed de bienvenue.
  const w = cfg.welcome;
  if (!w?.joinEnabled || !w.joinChannel) return;
  const channel = member.guild.channels.cache.get(w.joinChannel);
  if (!channel?.isTextBased()) return;

  await sendAsManagedBot(w.botId, member.guild.id, w.joinChannel, { content: `<@${member.id}>`, embeds: [buildJoinEmbed(member, w.joinMessage).toJSON()] })
    .catch(() => {});
}
