import dotenv from "dotenv";
import { REST, Routes } from "discord.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const guildId = process.env.DISCORD_DEV_GUILD_ID;
const managed = JSON.parse(process.env.MANAGED_BOTS_JSON || "[]");
const cordBot = managed.find((bot) => /^cordbot$/i.test(bot.name));
if (!guildId || !cordBot?.id || !cordBot?.token) throw new Error("Serveur ou CordBot manquant.");

const SUPPORT_CHANNEL = "1518688820634320986";
const NOTIFICATIONS_CHANNEL = "1523704000954896476";
const TICKETS_CATEGORY = "1518692394927657010";
const TICKET_LOG_CHANNEL = "1523468761510707290";
const rest = new REST({ version: "10", timeout: 15_000 }).setToken(cordBot.token);
const prisma = new PrismaClient();

const roleDefinitions = {
  general: [
    { name: "📢・Annonces", label: "Annonces", emoji: "📢" },
    { name: "🚀・Mises à jour", label: "Mises à jour", emoji: "🚀" },
    { name: "🎉・Événements", label: "Événements", emoji: "🎉" },
    { name: "📊・Sondages", label: "Sondages", emoji: "📊" },
    { name: "🎁・Giveaways", label: "Giveaways", emoji: "🎁" },
  ],
  tools: [
    { name: "☁️・Drivecord", label: "Drivecord", emoji: "☁️" },
    { name: "🎙️・Tunecord", label: "Tunecord", emoji: "🎙️" },
    { name: "🔐・Passcord", label: "Passcord", emoji: "🔐" },
    { name: "📝・Notecord", label: "Notecord", emoji: "📝" },
    { name: "🔗・Linkcord", label: "Linkcord", emoji: "🔗" },
    { name: "🍱・Bentocord", label: "Bentocord", emoji: "🍱" },
    { name: "➡️・Gocord", label: "Gocord", emoji: "➡️" },
    { name: "🎯・Quizcord", label: "Quizcord", emoji: "🎯" },
    { name: "💰・Budgetcord", label: "Budgetcord", emoji: "💰" },
  ],
};

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

async function upsertCordBotMessage(channelId, marker, body) {
  const messages = await rest.get(Routes.channelMessages(channelId), { query: new URLSearchParams({ limit: "100" }) });
  const existing = messages.find((message) => message.author.id === cordBot.id && message.embeds.some((embed) => embed.footer?.text === marker));
  const message = existing
    ? await rest.patch(Routes.channelMessage(channelId, existing.id), { body })
    : await rest.post(Routes.channelMessages(channelId), { body });
  return message;
}

async function savePanel({ title, description, color, roles }) {
  let panel = await prisma.reactionRolePanel.findFirst({ where: { guildId, title } });
  if (!panel) {
    panel = await prisma.reactionRolePanel.create({
      data: { guildId, botId: cordBot.id, channelId: NOTIFICATIONS_CHANNEL, title, description, color, multiple: true },
    });
  } else {
    panel = await prisma.reactionRolePanel.update({
      where: { id: panel.id },
      data: { botId: cordBot.id, channelId: NOTIFICATIONS_CHANNEL, title, description, color, multiple: true },
    });
  }
  await prisma.$transaction([
    prisma.reactionRoleOption.deleteMany({ where: { panelId: panel.id } }),
    prisma.reactionRoleOption.createMany({
      data: roles.map((role, position) => ({ panelId: panel.id, roleId: role.id, label: role.label, emoji: role.emoji, position })),
    }),
  ]);

  const marker = `Cordsuite • ${title.toLocaleLowerCase("fr-FR")}`;
  const components = chunks(roles, 5).map((row) => ({
    type: 1,
    components: row.map((role) => ({
      type: 2,
      style: 2,
      custom_id: `selfrole:${panel.id}:${role.id}`,
      label: role.label,
      emoji: { name: role.emoji },
    })),
  }));
  const message = await upsertCordBotMessage(NOTIFICATIONS_CHANNEL, marker, {
    embeds: [{ title, description, color, footer: { text: marker } }],
    components,
    allowed_mentions: { parse: [] },
  });
  await prisma.reactionRolePanel.update({ where: { id: panel.id }, data: { messageId: message.id } });
  return { panelId: panel.id, messageId: message.id };
}

try {
  await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });
  const discordRoles = await rest.get(Routes.guildRoles(guildId));
  const roleMap = new Map(discordRoles.map((role) => [role.name, role]));
  const staffRoles = discordRoles.filter((role) => !role.managed && /(fondateur|technicien|mod.rateur|d.veloppeur|support|staff|admin)/i.test(role.name));
  const supportRole = discordRoles.find((role) => !role.managed && /support/i.test(role.name));
  if (staffRoles.length === 0) throw new Error("Aucun rôle staff trouvé.");

  await prisma.ticketConfig.upsert({
    where: { guildId },
    create: {
      guildId,
      botId: cordBot.id,
      enabled: true,
      panelChannel: SUPPORT_CHANNEL,
      categoryId: TICKETS_CATEGORY,
      logChannel: TICKET_LOG_CHANNEL,
      staffRoleIds: staffRoles.map((role) => role.id),
      pingRoleIds: supportRole ? [supportRole.id] : [],
      panelTitle: "Contacter le support Cordsuite 🎫",
      panelDescription: "Choisis **Ouvrir un ticket** pour créer un salon privé avec l’équipe.\n\nAvant d’ouvrir une demande, consulte la documentation et la FAQ. Dans le ticket, indique l’outil concerné, explique le problème et ajoute les étapes déjà essayées.\n\nUn membre peut avoir jusqu’à **2 tickets ouverts** en même temps.",
      panelColor: 0x8b4cf5,
      buttonLabel: "Ouvrir un ticket",
      buttonEmoji: "🎫",
      openMessage: "Bonjour {user} 👋\n\nDécris ta demande avec le plus de détails possible : outil concerné, résultat attendu, problème rencontré et étapes déjà essayées. Un membre du staff va prendre ton ticket en charge.",
      maxOpen: 2,
    },
    update: {
      botId: cordBot.id,
      enabled: true,
      panelChannel: SUPPORT_CHANNEL,
      categoryId: TICKETS_CATEGORY,
      logChannel: TICKET_LOG_CHANNEL,
      staffRoleIds: staffRoles.map((role) => role.id),
      pingRoleIds: supportRole ? [supportRole.id] : [],
      panelTitle: "Contacter le support Cordsuite 🎫",
      panelDescription: "Choisis **Ouvrir un ticket** pour créer un salon privé avec l’équipe.\n\nAvant d’ouvrir une demande, consulte la documentation et la FAQ. Dans le ticket, indique l’outil concerné, explique le problème et ajoute les étapes déjà essayées.\n\nUn membre peut avoir jusqu’à **2 tickets ouverts** en même temps.",
      panelColor: 0x8b4cf5,
      buttonLabel: "Ouvrir un ticket",
      buttonEmoji: "🎫",
      openMessage: "Bonjour {user} 👋\n\nDécris ta demande avec le plus de détails possible : outil concerné, résultat attendu, problème rencontré et étapes déjà essayées. Un membre du staff va prendre ton ticket en charge.",
      maxOpen: 2,
    },
  });

  const ticketMarker = "Cordsuite • support tickets";
  const ticketMessage = await upsertCordBotMessage(SUPPORT_CHANNEL, ticketMarker, {
    embeds: [{
      title: "Contacter le support Cordsuite 🎫",
      description: "Choisis **Ouvrir un ticket** pour créer un salon privé avec l’équipe.\n\nAvant d’ouvrir une demande, consulte la documentation et la FAQ. Dans le ticket, indique l’outil concerné, explique le problème et ajoute les étapes déjà essayées.\n\nUn membre peut avoir jusqu’à **2 tickets ouverts** en même temps.",
      color: 0x8b4cf5,
      footer: { text: ticketMarker },
    }],
    components: [{ type: 1, components: [{ type: 2, style: 1, custom_id: "ticket:open", label: "Ouvrir un ticket", emoji: { name: "🎫" } }] }],
    allowed_mentions: { parse: [] },
  });

  const resolved = Object.fromEntries(Object.entries(roleDefinitions).map(([group, definitions]) => [
    group,
    definitions.map((definition) => {
      const discordRole = roleMap.get(definition.name);
      if (!discordRole) throw new Error(`Rôle absent : ${definition.name}`);
      return { ...definition, id: discordRole.id };
    }),
  ]));

  const generalPanel = await savePanel({
    title: "Notifications générales",
    description: "Choisis les informations que tu veux recevoir. Clique sur un bouton pour **ajouter** le rôle correspondant, puis reclique pour le **retirer**. Tu peux en sélectionner plusieurs.",
    color: 0x6255ed,
    roles: resolved.general,
  });
  const toolsPanel = await savePanel({
    title: "Suivre les outils",
    description: "Active uniquement les outils qui t’intéressent pour recevoir leurs annonces, nouveautés et informations importantes. Chaque bouton peut être activé ou retiré à tout moment.",
    color: 0xc336ed,
    roles: resolved.tools,
  });

  console.log(JSON.stringify({
    sender: "CordBot",
    tickets: { enabled: true, messageId: ticketMessage.id, staffRoles: staffRoles.length, maxOpen: 2 },
    notifications: { general: { ...generalPanel, roles: resolved.general.length }, tools: { ...toolsPanel, roles: resolved.tools.length } },
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
