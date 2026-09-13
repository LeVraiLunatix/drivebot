import dotenv from "dotenv";
import { PermissionFlagsBits, REST, Routes } from "discord.js";

dotenv.config();

const guildId = process.env.DISCORD_DEV_GUILD_ID;
const managed = JSON.parse(process.env.MANAGED_BOTS_JSON || "[]");
const cordBot = managed.find((bot) => /^cordbot$/i.test(bot.name));
if (!guildId || !cordBot?.token) throw new Error("Serveur ou CordBot manquant.");

const RULES_CHANNEL_ID = "1521281341407232172";
const VERIFICATION_CHANNEL_ID = "1523469828403368008";
const SUGGESTIONS_CHANNEL_ID = "1523706697372401674";
const PUBLIC_CATEGORY_IDS = [
  "1518687859299844146", // INFORMATIONS
  "1518687859299844147", // SUPPORT & AIDE
  "1518688909360500988", // COMMUNAUTÉ
  "1523469564921249864", // VÉRIFICATION
  "1548282797079265311", // LA SUITE
  "1548282802355834931", // LES OUTILS
];

const view = PermissionFlagsBits.ViewChannel;
const read = PermissionFlagsBits.ReadMessageHistory;
const send = PermissionFlagsBits.SendMessages;
const embed = PermissionFlagsBits.EmbedLinks;
const readOnly = view | read;
const botAccess = view | read | send | embed;
const staffRolePattern = /(fondateur|technicien|mod.rateur|d.veloppeur|support|staff|admin)/i;

const rest = new REST({ version: "10", timeout: 15_000 }).setToken(cordBot.token);
const [roles, channels] = await Promise.all([
  rest.get(Routes.guildRoles(guildId)),
  rest.get(Routes.guildChannels(guildId)),
]);
const channelMap = new Map(channels.map((channel) => [channel.id, channel]));

const verified = roles.find((role) => /membres? v.rifi/i.test(role.name));
const unverified = roles.find((role) => /non v.rifi/i.test(role.name));
const botRole = roles.find((role) => /bots?/i.test(role.name) && !role.managed);
const staffRoles = roles.filter((role) => !role.managed && role.id !== guildId && staffRolePattern.test(role.name));
if (!verified || !unverified || !botRole || staffRoles.length === 0) {
  throw new Error("Rôles de vérification, bots ou staff introuvables.");
}

function merge(overwrites, id, type, allowBits = 0n, denyBits = 0n) {
  const next = overwrites.map((item) => ({ ...item }));
  let item = next.find((entry) => entry.id === id && Number(entry.type) === type);
  if (!item) {
    item = { id, type, allow: "0", deny: "0" };
    next.push(item);
  }
  item.allow = ((BigInt(item.allow || "0") | allowBits) & ~denyBits).toString();
  item.deny = ((BigInt(item.deny || "0") | denyBits) & ~allowBits).toString();
  return next;
}

function role(overwrites, id, allowBits, denyBits) {
  return merge(overwrites, id, 0, allowBits, denyBits);
}

function publicPermissions(channel) {
  let overwrites = channel.permission_overwrites || [];
  overwrites = role(overwrites, unverified.id, 0n, view);
  return overwrites;
}

async function patchPermissions(channelId, permission_overwrites) {
  await rest.patch(Routes.channel(channelId), {
    body: { permission_overwrites },
    reason: "Parcours de vérification Cordsuite",
  });
}

// Ces six catégories contiennent tous les espaces publics. Leurs salons sont
// déjà synchronisés, Discord propage donc les changements sans les désynchroniser.
for (const categoryId of PUBLIC_CATEGORY_IDS) {
  const category = channelMap.get(categoryId);
  if (!category) throw new Error(`Catégorie absente : ${categoryId}`);
  await patchPermissions(categoryId, publicPermissions(category));
}

// Suggestions est le seul salon public désynchronisé de sa catégorie.
const suggestions = channelMap.get(SUGGESTIONS_CHANNEL_ID);
if (suggestions) await patchPermissions(suggestions.id, publicPermissions(suggestions));

// Le règlement reste visible en lecture seule avant et après la vérification.
const rules = channelMap.get(RULES_CHANNEL_ID);
if (!rules) throw new Error("Salon règlement absent.");
let rulesPermissions = rules.permission_overwrites || [];
rulesPermissions = role(rulesPermissions, unverified.id, readOnly, send);
rulesPermissions = role(rulesPermissions, botRole.id, botAccess, 0n);
await patchPermissions(rules.id, rulesPermissions);

// Le salon de vérification est lisible avant validation, puis son overwrite
// refuse explicitement ViewChannel au rôle vérifié : il disparaît aussitôt.
const verification = channelMap.get(VERIFICATION_CHANNEL_ID);
if (!verification) throw new Error("Salon vérification absent.");
let verificationPermissions = verification.permission_overwrites || [];
verificationPermissions = role(verificationPermissions, unverified.id, readOnly, send);
verificationPermissions = role(verificationPermissions, verified.id, 0n, view);
for (const staffRole of staffRoles) verificationPermissions = role(verificationPermissions, staffRole.id, view | read | send, 0n);
verificationPermissions = role(verificationPermissions, botRole.id, botAccess, 0n);
await patchPermissions(verification.id, verificationPermissions);

console.log(JSON.stringify({
  categoriesUpdated: PUBLIC_CATEGORY_IDS.length,
  extraPublicChannelsUpdated: suggestions ? 1 : 0,
  rulesVisibleBeforeAndAfter: true,
  verificationVisibleBefore: true,
  verificationHiddenAfter: true,
  newcomerRole: unverified.name,
  memberRole: verified.name,
}, null, 2));
