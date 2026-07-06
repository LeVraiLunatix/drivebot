import { type ButtonInteraction, type GuildMember } from "discord.js";

/** Bouton « selfrole:<roleId> » : ajoute ou retire le rôle au membre. */
export async function toggleSelfRole(interaction: ButtonInteraction): Promise<void> {
  const roleId = interaction.customId.split(":")[1];
  const member = interaction.member as GuildMember | null;
  if (!interaction.guild || !member || !roleId) return;

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    await interaction.reply({ content: "Ce rôle n'existe plus.", ephemeral: true });
    return;
  }

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.reply({ content: `❌ Rôle **${role.name}** retiré.`, ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `✅ Rôle **${role.name}** ajouté !`, ephemeral: true });
    }
  } catch {
    await interaction.reply({
      content: "Impossible de modifier ce rôle (vérifie que Drivebot est au-dessus dans la hiérarchie).",
      ephemeral: true,
    });
  }
}
