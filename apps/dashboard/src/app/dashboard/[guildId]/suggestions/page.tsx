import { prisma } from "@drivebot/database";
import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { PageHeader } from "@/components/ui/PageHeader";
import { SuggestionsForm } from "@/components/config/SuggestionsForm";

export default async function SuggestionsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const [meta, config] = await Promise.all([getGuildMeta(guildId), prisma.suggestionConfig.findUnique({ where: { guildId } })]);
  return <><PageHeader title="Suggestions" description="Ajoute automatiquement les votes ✅ et ❌ aux nouveaux posts du forum." />
    <SuggestionsForm guildId={guildId} forums={meta?.forums ?? []} initial={{ enabled: config?.enabled ?? false, channelId: config?.channelId ?? "", botId: config?.botId ?? null }} /></>;
}
