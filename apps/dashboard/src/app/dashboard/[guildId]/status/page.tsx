import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta, getBotStatus } from "@/lib/bot";
import { loadStatusConfig } from "@/lib/config/status";
import { StatusForm } from "@/components/config/StatusForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconActivity } from "@/components/ui/Icons";

export default async function StatusPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);

  const [meta, status, initial] = await Promise.all([
    getGuildMeta(guildId),
    getBotStatus(),
    loadStatusConfig(guildId),
  ]);

  return (
    <>
      <PageHeader
        title="Statut du bot"
        description="Ping, uptime et rapport automatique dans un salon."
        icon={<IconActivity />}
      />

      <StatusForm guildId={guildId} meta={meta} initial={initial} status={status} />
    </>
  );
}
