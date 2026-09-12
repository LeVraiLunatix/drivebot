import { assertGuildAccess } from "@/lib/guard";
import { getGuildBots, getBotStatus, getGuildMeta } from "@/lib/bot";
import { PageHeader } from "@/components/ui/PageHeader";
import { BotControl } from "@/components/config/BotControl";

export default async function BotsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const [bots, status, meta] = await Promise.all([getGuildBots(guildId), getBotStatus(), getGuildMeta(guildId)]);
  return <><PageHeader title="Mes bots" description="Gère la connexion, le profil, la présence et les messages de tes bots." />
    <BotControl guildId={guildId} bots={bots} online={status?.online === true} channels={meta?.channels ?? []} /></>;
}
