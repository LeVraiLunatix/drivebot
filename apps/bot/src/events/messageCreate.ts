import type { Message } from "discord.js";
import { checkSpam } from "../lib/protection.js";

/** Vérifie chaque message contre l'anti-spam. */
export async function onMessageCreate(message: Message): Promise<void> {
  await checkSpam(message).catch((e) => console.error("[protection] checkSpam:", e));
}
