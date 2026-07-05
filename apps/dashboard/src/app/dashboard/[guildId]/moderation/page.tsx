import Link from "next/link";
import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadModerationConfig, recentCases } from "@/lib/config/moderation";
import { ModerationForm } from "@/components/config/ModerationForm";

const TYPE_LABEL: Record<string, string> = {
  WARN: "Avertissement",
  KICK: "Expulsion",
  BAN: "Bannissement",
  UNBAN: "Débannissement",
  TIMEOUT: "Exclusion temporaire",
};

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);

  const [meta, initial, cases] = await Promise.all([
    getGuildMeta(guildId),
    loadModerationConfig(guildId),
    recentCases(guildId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/dashboard/${guildId}`}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {guild.name}
      </Link>
      <h1 className="mb-8 mt-3 text-2xl font-bold">Modération & logs</h1>

      <ModerationForm guildId={guildId} meta={meta} initial={initial} />

      <h2 className="mb-3 mt-10 text-lg font-semibold">Dernières sanctions</h2>
      {cases.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucune sanction enregistrée.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cases.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{TYPE_LABEL[c.type] ?? c.type}</span>{" "}
                <span className="text-neutral-400">· cible {c.targetUserId}</span>
                {c.reason && <span className="text-neutral-500"> — {c.reason}</span>}
              </span>
              <time className="text-xs text-neutral-600">
                {c.createdAt.toLocaleDateString("fr-FR")}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
