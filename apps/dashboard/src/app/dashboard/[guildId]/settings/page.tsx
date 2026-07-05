import Link from "next/link";
import { assertGuildAccess } from "@/lib/guard";
import { loadSettings } from "@/lib/config/settings";
import { SettingsForm } from "@/components/config/SettingsForm";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);
  const initial = await loadSettings(guildId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/dashboard/${guildId}`}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {guild.name}
      </Link>
      <h1 className="mb-8 mt-3 text-2xl font-bold">Paramètres</h1>
      <SettingsForm guildId={guildId} initial={initial} />
    </main>
  );
}
