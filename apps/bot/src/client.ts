import { Client, GatewayIntentBits, Partials } from "discord.js";

/** GuildMembers est un intent privilégié : à activer dans le portail développeur
 *  Discord (Bot → Privileged Gateway Intents) pour la bienvenue/autorole. */
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.GuildMember],
});
