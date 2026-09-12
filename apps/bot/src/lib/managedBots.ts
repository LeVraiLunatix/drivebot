import { Client, Events, GatewayIntentBits, REST, Routes, type APIUser, type APIGuildMember, type RESTGetAPIChannelResult, type ActivityType } from "discord.js";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { client } from "../client.js";
import { defaultPreferences, validatePreferences, type BotPreferences } from "./managedBotInput.js";

type Entry = { id: string; name: string; token: string; client: Client; rest: REST; primary: boolean; preferences: BotPreferences; error: string | null };
const entries = new Map<string, Entry>();
const settingsPath = fileURLToPath(new URL("../../../../data/bot-controls.json", import.meta.url));
let settings: Record<string, BotPreferences> = {};
let queue: Promise<unknown> = Promise.resolve();

function serialized<T>(work: () => Promise<T>): Promise<T> {
  const task = queue.then(work, work);
  queue = task.catch(() => {});
  return task;
}

async function persist(id: string, preferences: BotPreferences) {
  const next = { ...settings, [id]: preferences };
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(`${settingsPath}.tmp`, JSON.stringify(next, null, 2), { mode: 0o600 });
  await rename(`${settingsPath}.tmp`, settingsPath);
  settings = next;
}

function applyPresence(entry: Entry) {
  const p = entry.preferences;
  entry.client.user?.setPresence({ status: p.status, activities: p.activity ? [{ name: p.activity, type: p.activityType as ActivityType }] : [] });
}

async function connect(entry: Entry) {
  if (entry.client.isReady()) { applyPresence(entry); return; }
  try {
    await entry.client.login(entry.token);
    entry.error = null;
  } catch {
    entry.error = "Connexion refusée : vérifier le token et les intents Discord.";
  }
}

export async function startManagedBots() {
  try {
    const raw = JSON.parse(await readFile(settingsPath, "utf8"));
    for (const [id, value] of Object.entries(raw)) { const p = validatePreferences(value); if (p) settings[id] = p; }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Impossible de lire data/bot-controls.json.");
  }
  const credentials: { id: string; name: string; token: string }[] = JSON.parse(process.env.MANAGED_BOTS_JSON || "[]");
  credentials.unshift({ id: config.clientId, name: "Drivebot", token: config.token });
  for (const credential of credentials) {
    if (!/^\d{17,20}$/.test(credential.id) || typeof credential.token !== "string" || !credential.token || entries.has(credential.id)) continue;
    const primary = credential.id === config.clientId;
    const botClient = primary ? client : new Client({ intents: [GatewayIntentBits.Guilds], rest: { timeout: 12_000, retries: 0 } });
    botClient.rest.setToken(credential.token);
    // Client.destroy() efface son token REST : un client REST distinct permet de
    // gérer le profil et de réactiver un bot dont la gateway est déconnectée.
    const rest = new REST({ version: "10", timeout: 12_000, retries: 0 }).setToken(credential.token);
    const entry: Entry = { ...credential, client: botClient, rest, primary, preferences: { ...(settings[credential.id] || defaultPreferences), ...(primary ? { enabled: true } : {}) }, error: null };
    entries.set(entry.id, entry);
    botClient.on(Events.ClientReady, () => { entry.error = null; applyPresence(entry); });
    botClient.on(Events.Error, () => { entry.error = "Connexion Discord interrompue."; });
    if (entry.preferences.enabled) await connect(entry);
  }
}

export async function stopManagedBots() {
  await Promise.all([...entries.values()].map((e) => e.client.destroy()));
}

export async function managedBotInventory(guildId: string) {
  // Les tokens restent uniquement dans ce processus. Aucun objet Entry n'est renvoyé.
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error("Serveur introuvable.");
  const members = await guild.members.fetch({ time: 10_000 });
  return members.filter((member) => member.user.bot).map((member) => {
    const entry = entries.get(member.id);
    return {
      id: member.id, name: member.displayName, username: member.user.username,
      avatarUrl: member.user.displayAvatarURL({ size: 128 }),
      controlled: Boolean(entry), primary: entry?.primary ?? false,
      online: entry ? entry.client.isReady() : null,
      preferences: entry?.preferences ?? null, error: entry?.error ?? null,
      roles: member.roles.cache.filter((r) => r.id !== guildId).map((r) => r.name),
    };
  }).sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name));
}

export async function controlManagedBot(guildId: string, botId: string, body: unknown) {
  return serialized(async () => {
    const entry = entries.get(botId);
    if (!entry) return { ok: false, error: "Ce bot n'est pas connecté au dashboard." };
    // Vérifie l'appartenance au serveur à chaque commande, même pour un client déconnecté.
    await entry.rest.get(Routes.guild(guildId));
    const data = body as Record<string, unknown> | null;
    if (data?.action === "preferences") {
      const preferences = validatePreferences(data.preferences);
      if (!preferences) return { ok: false, error: "Statut ou activité invalide." };
      if (entry.primary && !preferences.enabled) return { ok: false, error: "Drivebot assure le contrôle du serveur : utilise Invisible pour masquer sa présence." };
      await persist(botId, preferences);
      entry.preferences = preferences;
      if (!preferences.enabled) { await entry.client.destroy(); entry.error = null; }
      else await connect(entry);
      if (entry.error) return { ok: false, error: `Réglages enregistrés. ${entry.error}` };
      return { ok: true };
    }
    if (data?.action === "nickname") {
      if (typeof data.nickname !== "string" || data.nickname.length > 32) return { ok: false, error: "Le surnom doit contenir au maximum 32 caractères." };
      await entry.rest.patch(Routes.guildMember(guildId, "@me"), { body: { nick: data.nickname.trim() || null }, reason: "Propriétaire du dashboard" }) as APIGuildMember;
      return { ok: true };
    }
    if (data?.action === "username") {
      if (typeof data.username !== "string" || data.username.trim().length < 2 || data.username.trim().length > 32) return { ok: false, error: "Le nom doit contenir de 2 à 32 caractères." };
      await entry.rest.patch(Routes.user(), { body: { username: data.username.trim() } }) as APIUser;
      return { ok: true };
    }
    if (data?.action === "message") {
      if (typeof data.channelId !== "string" || !/^\d{17,20}$/.test(data.channelId) || typeof data.content !== "string" || !data.content.trim() || data.content.length > 2000) return { ok: false, error: "Choisis un salon et un message de 1 à 2 000 caractères." };
      const channel = await entry.rest.get(Routes.channel(data.channelId)) as RESTGetAPIChannelResult;
      if (!("guild_id" in channel) || channel.guild_id !== guildId || ![0, 5].includes(channel.type)) return { ok: false, error: "Le salon doit être un salon textuel de ce serveur." };
      const sent = await entry.rest.post(Routes.channelMessages(data.channelId), { body: { content: data.content.trim(), allowed_mentions: { parse: [] } } }) as { id: string };
      return { ok: true, messageUrl: `https://discord.com/channels/${guildId}/${data.channelId}/${sent.id}` };
    }
    return { ok: false, error: "Commande inconnue." };
  });
}
