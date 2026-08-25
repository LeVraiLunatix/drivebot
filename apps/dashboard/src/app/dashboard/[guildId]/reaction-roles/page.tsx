import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadPanels } from "@/lib/config/reactionRoles";
import { ReactionRolesManager } from "@/components/config/ReactionRolesManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconTag } from "@/components/ui/Icons";

export default async function ReactionRolesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);

  const [meta, panels] = await Promise.all([getGuildMeta(guildId), loadPanels(guildId)]);

  return (
    <>
      <PageHeader
        title="Rôles à la carte"
        description="Panneaux de boutons pour que les membres choisissent leurs rôles."
        icon={<IconTag />}
      />
      <ReactionRolesManager guildId={guildId} meta={meta} initialPanels={panels} />
    </>
  );
}
