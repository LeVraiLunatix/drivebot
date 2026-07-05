import Link from "next/link";
import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadWelcomeConfig } from "@/lib/config/welcome";
import { WelcomeForm } from "@/components/config/WelcomeForm";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);

  const [meta, initial] = await Promise.all([
    getGuildMeta(guildId),
    loadWelcomeConfig(guildId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/dashboard/${guildId}`}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {guild.name}
      </Link>
      <h1 className="mb-8 mt-3 text-2xl font-bold">Bienvenue & autorole</h1>

      <WelcomeForm guildId={guildId} meta={meta} initial={initial} />
    </main>
  );
}
