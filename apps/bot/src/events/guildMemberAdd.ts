import { type GuildMember } from "discord.js";
import { getGuildConfig } from "../lib/guildConfig.js";
import { checkRaid } from "../lib/protection.js";
import { sendWelcomeMessage } from "../lib/welcome.js";

/** À l'arrivée : anti-raid, rôle non-vérifié, autorôles et éventuellement bienvenue immédiate. */
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

  // Avec la vérification active, la bienvenue attend sa réussite.
  const w = cfg.welcome;
  if (w?.joinAfterVerification && v?.enabled) return;

  await sendWelcomeMessage(member).catch((error) => {
    console.error(`[welcome] envoi impossible pour ${member.id}:`, error);
  });
}
