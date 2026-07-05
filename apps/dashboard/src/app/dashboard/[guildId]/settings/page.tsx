import { assertGuildAccess } from "@/lib/guard";
import { loadSettings } from "@/lib/config/settings";
import { SettingsForm } from "@/components/config/SettingsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconSettings } from "@/components/ui/Icons";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const initial = await loadSettings(guildId);

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Langue et préfixe des commandes."
        icon={<IconSettings />}
      />
      <SettingsForm guildId={guildId} initial={initial} />
    </>
  );
}
