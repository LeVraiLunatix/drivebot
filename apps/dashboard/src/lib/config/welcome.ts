import "server-only";
import { prisma } from "@drivebot/database";
import { triggerReload } from "@/lib/bot";

export interface WelcomeFormData {
  joinEnabled: boolean;
  joinChannel: string | null;
  joinMessage: string;
  leaveEnabled: boolean;
  leaveChannel: string | null;
  leaveMessage: string;
  autoRoleIds: string[];
}

/** Config bienvenue/autorole actuelle, avec valeurs par défaut si non configurée. */
export async function loadWelcomeConfig(
  guildId: string,
): Promise<WelcomeFormData> {
  const [welcome, autoRoles] = await Promise.all([
    prisma.welcomeConfig.findUnique({ where: { guildId } }),
    prisma.autoRole.findMany({ where: { guildId } }),
  ]);

  return {
    joinEnabled: welcome?.joinEnabled ?? false,
    joinChannel: welcome?.joinChannel ?? null,
    joinMessage: welcome?.joinMessage ?? "Bienvenue {user} sur {server} ! 🎉",
    leaveEnabled: welcome?.leaveEnabled ?? false,
    leaveChannel: welcome?.leaveChannel ?? null,
    leaveMessage: welcome?.leaveMessage ?? "{username} a quitté le serveur.",
    autoRoleIds: autoRoles.map((r) => r.roleId),
  };
}

/** Écrit la config en base (upsert) puis demande au bot de recharger son cache. */
export async function saveWelcomeConfig(
  guildId: string,
  data: WelcomeFormData,
): Promise<void> {
  // S'assure que le serveur existe (le bot le crée aussi à la volée).
  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId },
    update: {},
  });

  await prisma.welcomeConfig.upsert({
    where: { guildId },
    create: { guildId, ...toColumns(data) },
    update: toColumns(data),
  });

  // Remplace l'ensemble des autorôles par la nouvelle sélection.
  await prisma.$transaction([
    prisma.autoRole.deleteMany({ where: { guildId } }),
    prisma.autoRole.createMany({
      data: data.autoRoleIds.map((roleId) => ({ guildId, roleId })),
      skipDuplicates: true,
    }),
  ]);

  await triggerReload(guildId);
}

function toColumns(data: WelcomeFormData) {
  return {
    joinEnabled: data.joinEnabled,
    joinChannel: data.joinChannel,
    joinMessage: data.joinMessage,
    leaveEnabled: data.leaveEnabled,
    leaveChannel: data.leaveChannel,
    leaveMessage: data.leaveMessage,
  };
}
