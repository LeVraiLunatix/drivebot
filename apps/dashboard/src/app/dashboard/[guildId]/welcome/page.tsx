import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadWelcomeConfig } from "@/lib/config/welcome";
import { WelcomeForm } from "@/components/config/WelcomeForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconWave } from "@/components/ui/Icons";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const [meta, initial] = await Promise.all([
    getGuildMeta(guildId),
    loadWelcomeConfig(guildId),
  ]);

  return (
    <>
      <PageHeader
        title="Bienvenue & autorole"
        description="Accueille les nouveaux membres et attribue des rôles."
        icon={<IconWave />}
      />
      <WelcomeForm guildId={guildId} meta={meta} initial={initial} />
    </>
  );
}
