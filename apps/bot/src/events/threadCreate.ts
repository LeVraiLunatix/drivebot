import { type AnyThreadChannel, ChannelType } from "discord.js";
import { getGuildConfig } from "../lib/guildConfig.js";

/** À la création d'un post dans le forum de suggestions : ajoute les
 *  réactions de vote ✅ / ❌ sur le message de départ. */
export async function onThreadCreate(thread: AnyThreadChannel): Promise<void> {
  if (!thread.guild) return;
  // Seuls les posts de forum nous intéressent.
  if (thread.parent?.type !== ChannelType.GuildForum) return;

  const cfg = await getGuildConfig(thread.guild.id);
  const s = cfg.suggestionCfg;
  if (!s?.enabled || thread.parentId !== s.channelId) return;

  try {
    // Laisse le temps au message de départ d'exister.
    const starter = await thread.fetchStarterMessage().catch(() => null);
    const target = starter ?? (await thread.messages.fetch({ limit: 1 })).first();
    if (!target) return;
    await target.react("✅");
    await target.react("❌");
  } catch (e) {
    console.warn("[suggestion] réactions échouées:", (e as Error).message);
  }
}
