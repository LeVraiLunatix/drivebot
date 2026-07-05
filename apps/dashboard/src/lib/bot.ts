import "server-only";
import type { GuildMeta } from "@drivebot/types";

const BOT_URL = process.env.BOT_INTERNAL_URL ?? "http://localhost:3001";
const SECRET = process.env.INTERNAL_API_SECRET ?? "";

/** Salons + rôles d'un serveur (menus du dashboard). null si bot injoignable/absent. */
export async function getGuildMeta(guildId: string): Promise<GuildMeta | null> {
  try {
    const res = await fetch(`${BOT_URL}/internal/guilds/${guildId}/meta`, {
      headers: { "x-internal-secret": SECRET },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as GuildMeta;
  } catch {
    return null;
  }
}

/** IDs des serveurs où Drivebot est présent (depuis le cache gateway du bot). */
export async function getBotGuildIds(): Promise<Set<string>> {
  try {
    const res = await fetch(`${BOT_URL}/internal/guilds`, {
      headers: { "x-internal-secret": SECRET },
      // La liste change rarement : on met en cache 30 s.
      next: { revalidate: 30 },
    });
    if (!res.ok) return new Set();
    const { guildIds } = (await res.json()) as { guildIds: string[] };
    return new Set(guildIds);
  } catch {
    // Bot injoignable (endormi/redémarrage) : on renvoie vide plutôt que planter.
    return new Set();
  }
}

/** Demande au bot d'envoyer un embed dans un salon. */
export async function sendEmbedViaBot(
  guildId: string,
  channelId: string,
  embed: import("@drivebot/types").EmbedData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BOT_URL}/internal/guilds/${guildId}/send-embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": SECRET,
      },
      body: JSON.stringify({ channelId, embed }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch {
    return { ok: false, error: "Bot injoignable." };
  }
}

/** Demande au bot de (re)publier le panneau de tickets dans le salon configuré. */
export async function publishTicketPanelViaBot(
  guildId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BOT_URL}/internal/guilds/${guildId}/ticket-panel`, {
      method: "POST",
      headers: { "x-internal-secret": SECRET },
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch {
    return { ok: false, error: "Bot injoignable." };
  }
}

/** Demande au bot de publier le panneau de vérification. */
export async function publishVerifPanelViaBot(
  guildId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BOT_URL}/internal/guilds/${guildId}/verify-panel`, {
      method: "POST",
      headers: { "x-internal-secret": SECRET },
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch {
    return { ok: false, error: "Bot injoignable." };
  }
}

/** Demande au bot de recharger la config d'un serveur après une sauvegarde. */
export async function triggerReload(guildId: string): Promise<void> {
  try {
    await fetch(`${BOT_URL}/internal/reload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": SECRET,
      },
      body: JSON.stringify({ guildId }),
    });
  } catch {
    // Non bloquant : le cache du bot expirera de lui-même.
  }
}
