import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadTicketsConfig } from "@/lib/config/tickets";
import { TicketsForm } from "@/components/config/TicketsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconMessage } from "@/components/ui/Icons";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const [meta, initial] = await Promise.all([
    getGuildMeta(guildId),
    loadTicketsConfig(guildId),
  ]);

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Système de support par tickets (panneau, salons privés, staff)."
        icon={<IconMessage />}
      />
      <TicketsForm guildId={guildId} meta={meta} initial={initial} />
    </>
  );
}
