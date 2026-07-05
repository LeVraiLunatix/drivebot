import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadModerationConfig, recentCases } from "@/lib/config/moderation";
import { ModerationForm } from "@/components/config/ModerationForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";
import { IconShield } from "@/components/ui/Icons";

const TYPE: Record<string, { label: string; cls: string }> = {
  WARN: { label: "Avertissement", cls: "bg-amber-500/15 text-amber-400" },
  KICK: { label: "Expulsion", cls: "bg-orange-500/15 text-orange-400" },
  BAN: { label: "Bannissement", cls: "bg-red-500/15 text-red-400" },
  UNBAN: { label: "Débannissement", cls: "bg-emerald-500/15 text-emerald-400" },
  TIMEOUT: { label: "Exclusion temp.", cls: "bg-violet-500/15 text-violet-400" },
};

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);

  const [meta, initial, cases] = await Promise.all([
    getGuildMeta(guildId),
    loadModerationConfig(guildId),
    recentCases(guildId),
  ]);

  return (
    <>
      <PageHeader
        title="Modération & logs"
        description="Sanctions, journalisation et historique."
        icon={<IconShield />}
      />

      <div className="flex flex-col gap-6">
        <ModerationForm guildId={guildId} meta={meta} initial={initial} />

        <SectionCard title="Dernières sanctions">
          {cases.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune sanction enregistrée pour l'instant.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-line)]">
              {cases.map((c) => {
                const t = TYPE[c.type] ?? { label: c.type, cls: "bg-neutral-500/15 text-neutral-400" };
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.cls}`}>{t.label}</span>
                      <span className="ml-2 text-sm text-neutral-400">Cible {c.targetUserId}</span>
                      {c.reason && <p className="truncate text-sm text-neutral-500">{c.reason}</p>}
                    </div>
                    <time className="shrink-0 text-xs text-neutral-600">
                      {c.createdAt.toLocaleDateString("fr-FR")}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
