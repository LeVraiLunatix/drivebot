import Link from "next/link";
import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { listTemplates } from "@/lib/config/embeds";
import { EmbedBuilder } from "@/components/config/EmbedBuilder";

export default async function EmbedsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);

  const [meta, templates] = await Promise.all([
    getGuildMeta(guildId),
    listTemplates(guildId),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href={`/dashboard/${guildId}`}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {guild.name}
      </Link>
      <h1 className="mb-8 mt-3 text-2xl font-bold">Embed builder</h1>
      <EmbedBuilder guildId={guildId} meta={meta} templates={templates} />
    </main>
  );
}
