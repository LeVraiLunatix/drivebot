import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGuildMeta } from "./bot";

/** Le seul serveur gérable : Drivecord. Défini par env. */
export const DRIVECORD_GUILD_ID = process.env.DRIVECORD_GUILD_ID ?? "";

export interface GuardedGuild {
  id: string;
  name: string;
}

/** Exige une session valide (mot de passe) ET que le serveur soit Drivecord.
 *  À appeler en tête de chaque page/action serveur. */
export async function assertGuildAccess(
  guildId: string,
): Promise<GuardedGuild> {
  const session = await auth();
  if (!session) redirect("/");
  if (!DRIVECORD_GUILD_ID || guildId !== DRIVECORD_GUILD_ID) redirect("/dashboard");

  const meta = await getGuildMeta(guildId);
  return { id: guildId, name: meta?.name ?? "Serveur Drivecord" };
}
