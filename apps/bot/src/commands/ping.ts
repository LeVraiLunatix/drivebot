import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./types.js";

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Vérifie que Drivebot répond."),
  async execute(interaction) {
    await interaction.reply({
      content: `🏓 Pong ! Latence : ${Math.round(interaction.client.ws.ping)}ms`,
      ephemeral: true,
    });
  },
};
