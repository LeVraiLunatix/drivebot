import { prisma } from "@drivebot/database";

/** Config complète d'un serveur, chargée depuis la DB et mise en cache mémoire.
 *  Le dashboard invalide une entrée via l'API interne après chaque sauvegarde. */
export type FullGuildConfig = NonNullable<
  Awaited<ReturnType<typeof fetchGuildConfig>>
>;

const cache = new Map<string, FullGuildConfig>();
const loadedAt = new Map<string, number>();
const CACHE_TTL_MS = 30_000;

async function fetchGuildConfig(guildId: string) {
  return prisma.guild.findUnique({
    where: { id: guildId },
    include: {
      welcome: true,
      moderationCfg: true,
      verification: true,
      suggestionCfg: true,
      autoRoles: true,
      protection: true,
    },
  });
}

/** Renvoie la config (depuis le cache si présente), en la créant si le serveur
 *  n'existe pas encore en base. */
export async function getGuildConfig(guildId: string): Promise<FullGuildConfig> {
  const cached = cache.get(guildId);
  if (cached && Date.now() - (loadedAt.get(guildId) ?? 0) < CACHE_TTL_MS) return cached;

  let cfg = await fetchGuildConfig(guildId);
  if (!cfg) {
    await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });
    cfg = await fetchGuildConfig(guildId);
  }
  cache.set(guildId, cfg!);
  loadedAt.set(guildId, Date.now());
  return cfg!;
}

/** Vide le cache pour un serveur (appelé par l'API interne /internal/reload). */
export function invalidateGuildConfig(guildId: string): void {
  cache.delete(guildId);
  loadedAt.delete(guildId);
}
