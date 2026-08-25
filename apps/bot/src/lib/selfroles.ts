import { type ButtonInteraction, type GuildMember } from "discord.js";
import { prisma } from "@drivebot/database";

/** Bouton « selfrole:<panelId>:<roleId> » : ajoute ou retire le rôle au membre.
 *  Si le panneau est en mode "un seul rôle" (multiple = false), les autres
 *  rôles du même panneau sont retirés avant d'ajouter le nouveau. */
export async function toggleSelfRole(interaction: ButtonInteraction): Promise<void> {
  const [, panelId, roleId] = interaction.customId.split(":");
  const member = interaction.member as GuildMember | null;
  if (!interaction.guild || !member || !roleId) return;

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    await interaction.reply({ content: "Ce rôle n'existe plus.", ephemeral: true });
    return;
  }

  const panel = panelId
    ? await prisma.reactionRolePanel.findUnique({ where: { id: panelId }, include: { roles: true } })
    : null;

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.reply({ content: `❌ Rôle **${role.name}** retiré.`, ephemeral: true });
      return;
    }

    if (panel && !panel.multiple) {
      const others = panel.roles
        .map((r) => r.roleId)
        .filter((id) => id !== roleId && member.roles.cache.has(id));
      if (others.length) await member.roles.remove(others);
    }

    await member.roles.add(role);
    await interaction.reply({ content: `✅ Rôle **${role.name}** ajouté !`, ephemeral: true });
  } catch {
    await interaction.reply({
      content: "Impossible de modifier ce rôle (vérifie que Drivebot est au-dessus dans la hiérarchie).",
      ephemeral: true,
    });
  }
}
