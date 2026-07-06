import type { Interaction } from "discord.js";
import { commandMap } from "../commands/index.js";
import { openTicket, claimTicket, closeTicket } from "../lib/tickets.js";
import { startVerification, submitVerification } from "../lib/verification.js";
import { toggleSelfRole } from "../lib/selfroles.js";

/** Dispatch des slash commands, boutons (tickets, vérif) et modals (vérif). */
export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  // Boutons du système de tickets.
  if (interaction.isButton() && interaction.customId.startsWith("ticket:")) {
    try {
      if (interaction.customId === "ticket:open") await openTicket(interaction);
      else if (interaction.customId === "ticket:claim") await claimTicket(interaction);
      else if (interaction.customId === "ticket:close") await closeTicket(interaction);
    } catch (err) {
      console.error(`[ticket] erreur sur ${interaction.customId}:`, err);
    }
    return;
  }

  // Vérification : bouton + modal.
  if (interaction.isButton() && interaction.customId === "verify:start") {
    await startVerification(interaction).catch((e) => console.error("[verify]", e));
    return;
  }
  if (interaction.isModalSubmit() && interaction.customId.startsWith("verify:submit")) {
    await submitVerification(interaction).catch((e) => console.error("[verify]", e));
    return;
  }

  // Rôles auto-attribuables (notifications).
  if (interaction.isButton() && interaction.customId.startsWith("selfrole:")) {
    await toggleSelfRole(interaction).catch((e) => console.error("[selfrole]", e));
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[command] erreur sur /${interaction.commandName}:`, err);
    const reply = { content: "❌ Une erreur est survenue.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}
