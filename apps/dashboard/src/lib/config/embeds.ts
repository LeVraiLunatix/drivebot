import "server-only";
import { prisma } from "@drivebot/database";
import type { EmbedData } from "@drivebot/types";

export interface EmbedTemplateDto {
  id: string;
  name: string;
  data: EmbedData;
}

export async function listTemplates(guildId: string): Promise<EmbedTemplateDto[]> {
  const rows = await prisma.embedTemplate.findMany({
    where: { guildId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({ id: r.id, name: r.name, data: r.data as EmbedData }));
}

export async function saveTemplate(
  guildId: string,
  name: string,
  data: EmbedData,
): Promise<void> {
  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId },
    update: {},
  });
  await prisma.embedTemplate.create({
    data: { guildId, name, data: data as object },
  });
}

export async function deleteTemplate(guildId: string, id: string): Promise<void> {
  // Le guildId dans le filtre empêche de supprimer le modèle d'un autre serveur.
  await prisma.embedTemplate.deleteMany({ where: { id, guildId } });
}
