import { EmbedBuilder } from "discord.js";
import type { EmbedData } from "@drivebot/types";

/** Convertit un EmbedData (stocké en base / édité dans le builder) en
 *  EmbedBuilder discord.js prêt à être envoyé. */
export function buildEmbed(data: EmbedData): EmbedBuilder {
  const embed = new EmbedBuilder();

  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);
  if (data.url) embed.setURL(data.url);
  if (typeof data.color === "number") embed.setColor(data.color);
  if (data.timestamp) embed.setTimestamp(new Date(data.timestamp));
  if (data.author?.name)
    embed.setAuthor({
      name: data.author.name,
      url: data.author.url,
      iconURL: data.author.icon_url,
    });
  if (data.thumbnail?.url) embed.setThumbnail(data.thumbnail.url);
  if (data.image?.url) embed.setImage(data.image.url);
  if (data.footer?.text)
    embed.setFooter({ text: data.footer.text, iconURL: data.footer.icon_url });
  if (data.fields?.length)
    embed.addFields(
      data.fields.map((f) => ({
        name: f.name,
        value: f.value,
        inline: f.inline ?? false,
      })),
    );

  return embed;
}
