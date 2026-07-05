import { type GuildMember, TextChannel } from "discord.js";
import { getGuildConfig } from "../lib/guildConfig.js";
import { buildJoinEmbed } from "../lib/welcomeEmbed.js";

/** À l'arrivée : rôle non-vérifié (si vérif active), autorôles, embed de bienvenue. */
export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
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
  if (!(channel instanceof TextChannel)) return;

  await channel.send({ embeds: [buildJoinEmbed(member, w.joinMessage)] }).catch(() => {});
}
