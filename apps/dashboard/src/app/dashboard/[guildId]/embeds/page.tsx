import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { listTemplates } from "@/lib/config/embeds";
import { EmbedBuilder } from "@/components/config/EmbedBuilder";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconMessage } from "@/components/ui/Icons";

export default async function EmbedsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const [meta, templates] = await Promise.all([
    getGuildMeta(guildId),
    listTemplates(guildId),
  ]);

  return (
    <>
      <PageHeader
        title="Embed builder"
        description="Compose un embed, prévisualise-le et envoie-le."
        icon={<IconMessage />}
      />
      <EmbedBuilder guildId={guildId} meta={meta} templates={templates} />
    </>
  );
}
