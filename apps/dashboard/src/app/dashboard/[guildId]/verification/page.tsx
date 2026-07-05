import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadVerificationConfig } from "@/lib/config/verification";
import { VerificationForm } from "@/components/config/VerificationForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconShield } from "@/components/ui/Icons";

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const [meta, initial] = await Promise.all([
    getGuildMeta(guildId),
    loadVerificationConfig(guildId),
  ]);

  return (
    <>
      <PageHeader
        title="Vérification"
        description="Captcha anti-bot à l'entrée du serveur."
        icon={<IconShield />}
      />
      <VerificationForm guildId={guildId} meta={meta} initial={initial} />
    </>
  );
}
