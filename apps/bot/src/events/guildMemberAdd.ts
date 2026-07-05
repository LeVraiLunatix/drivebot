import { type GuildMember, TextChannel } from "discord.js";
import type { EmbedData } from "@drivebot/types";
import { getGuildConfig } from "../lib/guildConfig.js";
import { renderTemplate } from "../lib/templates.js";
import { buildEmbed } from "../lib/embed.js";

/** À l'arrivée d'un membre : message de bienvenue + attribution des autorôles. */
export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  const cfg = await getGuildConfig(member.guild.id);

  // Autorôles
  for (const { roleId } of cfg.autoRoles) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role).catch((e) => {
        console.warn(`[autorole] échec ${roleId} sur ${member.id}:`, e.message);
      });
    }
  }

  // Message de bienvenue
  const w = cfg.welcome;
  if (!w?.joinEnabled || !w.joinChannel) return;

  const channel = member.guild.channels.cache.get(w.joinChannel);
  if (!(channel instanceof TextChannel)) return;

  if (w.joinUseEmbed && w.joinEmbed) {
    const data = w.joinEmbed as unknown as EmbedData;
    // On rend les variables dans la description de l'embed.
    if (data.description) data.description = renderTemplate(data.description, member);
    await channel.send({ embeds: [buildEmbed(data)] }).catch(() => {});
  } else {
    await channel.send(renderTemplate(w.joinMessage, member)).catch(() => {});
  }
}
