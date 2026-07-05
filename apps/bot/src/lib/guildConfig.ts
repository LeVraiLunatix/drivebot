import { prisma } from "@drivebot/database";

/** Config complète d'un serveur, chargée depuis la DB et mise en cache mémoire.
 *  Le dashboard invalide une entrée via l'API interne après chaque sauvegarde. */
export type FullGuildConfig = NonNullable<
  Awaited<ReturnType<typeof fetchGuildConfig>>
>;

const cache = new Map<string, FullGuildConfig>();

async function fetchGuildConfig(guildId: string) {
  return prisma.guild.findUnique({
    where: { id: guildId },
    include: {
      welcome: true,
      moderationCfg: true,
      autoRoles: true,
    },
  });
}

/** Renvoie la config (depuis le cache si présente), en la créant si le serveur
 *  n'existe pas encore en base. */
export async function getGuildConfig(guildId: string): Promise<FullGuildConfig> {
  const cached = cache.get(guildId);
  if (cached) return cached;

  let cfg = await fetchGuildConfig(guildId);
  if (!cfg) {
    await prisma.guild.create({ data: { id: guildId } });
    cfg = await fetchGuildConfig(guildId);
  }
  cache.set(guildId, cfg!);
  return cfg!;
}

/** Vide le cache pour un serveur (appelé par l'API interne /internal/reload). */
export function invalidateGuildConfig(guildId: string): void {
  cache.delete(guildId);
}
