import dotenv from "dotenv";
import { ChannelType, PermissionFlagsBits, REST, Routes } from "discord.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const guildId = process.env.DISCORD_DEV_GUILD_ID;
const token = process.env.DISCORD_TOKEN;
if (!guildId || !token) throw new Error("Configuration Discord manquante.");

const rest = new REST({ version: "10", timeout: 15_000 }).setToken(token);
const prisma = new PrismaClient();
const staffPattern = /(fondateur|technicien|mod.rateur|d.veloppeur|support|staff|admin)/i;
const categoryName = "📊・STATUTS";

try {
  const [roles, channels] = await Promise.all([
    rest.get(Routes.guildRoles(guildId)),
    rest.get(Routes.guildChannels(guildId)),
  ]);
  const staffRoles = roles.filter((role) => role.id !== guildId && !role.tags?.bot_id && staffPattern.test(role.name));
  if (staffRoles.length === 0) throw new Error("Aucun rôle staff reconnu : arrêt avant modification des permissions.");

  const botIds = JSON.parse(process.env.MANAGED_BOTS_JSON || "[]").map((bot) => bot.id);
  botIds.unshift(process.env.DISCORD_CLIENT_ID);
  const view = PermissionFlagsBits.ViewChannel;
  const staffAllow = view | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.SendMessages;
  const botAllow = staffAllow | PermissionFlagsBits.EmbedLinks;
  const overwrites = [
    { id: guildId, type: 0, allow: "0", deny: view.toString() },
    ...staffRoles.map((role) => ({ id: role.id, type: 0, allow: staffAllow.toString(), deny: "0" })),
    ...botIds.filter(Boolean).map((id) => ({ id, type: 1, allow: botAllow.toString(), deny: "0" })),
  ];

  let category = channels.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === categoryName);
  if (!category) {
    category = await rest.post(Routes.guildChannels(guildId), {
      body: { name: categoryName, type: ChannelType.GuildCategory, permission_overwrites: overwrites },
    });
  } else {
    category = await rest.patch(Routes.channel(category.id), { body: { permission_overwrites: overwrites } });
  }

  const statusChannel = channels.find((channel) => channel.type === ChannelType.GuildText && /statut/i.test(channel.name));
  if (!statusChannel) throw new Error("Salon statut introuvable.");
  await rest.patch(Routes.channel(statusChannel.id), {
    body: {
      name: "📊・statut",
      parent_id: category.id,
      permission_overwrites: overwrites,
      topic: "État en direct de cordsuite.app et de tous les bots Cordsuite.",
    },
  });

  await prisma.guild.upsert({ where: { id: guildId }, create: { id: guildId }, update: {} });
  await prisma.botStatusConfig.upsert({
    where: { guildId },
    create: { guildId, enabled: true, channelId: statusChannel.id, botId: process.env.DISCORD_CLIENT_ID },
    update: { enabled: true, channelId: statusChannel.id },
  });

  console.log(`Salon #${statusChannel.name} déplacé dans ${categoryName}.`);
  console.log(`Accès staff : ${staffRoles.map((role) => role.name).join(", ")}.`);
} finally {
  await prisma.$disconnect();
}
