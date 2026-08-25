import type { Command } from "./types.js";
import { ping } from "./ping.js";
import { kick, ban, unban, timeout, warn } from "./moderation.js";

/** Registre des commandes slash. Ajoute-en ici et elles seront déployées
 *  par `npm run deploy-commands` et gérées par l'event interactionCreate. */
export const commands: Command[] = [ping, kick, ban, unban, timeout, warn];

export const commandMap = new Map<string, Command>(
  commands.map((c) => [c.data.name, c]),
);
