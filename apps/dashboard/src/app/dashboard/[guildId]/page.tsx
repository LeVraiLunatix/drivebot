import Link from "next/link";
import { assertGuildAccess } from "@/lib/guard";
import { SignOutButton } from "@/components/AuthButtons";

const SECTIONS = [
  { slug: "settings", title: "Paramètres", desc: "Langue, préfixe, général.", ready: true },
  { slug: "welcome", title: "Bienvenue & autorole", desc: "Arrivées, départs, rôles auto.", ready: true },
  { slug: "embeds", title: "Embed builder", desc: "Crée et envoie des embeds.", ready: true },
  { slug: "moderation", title: "Modération & logs", desc: "Sanctions et journalisation.", ready: true },
];

export default async function GuildHomePage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{guild.name}</h1>
        <SignOutButton />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const inner = (
            <>
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-neutral-400">{s.desc}</p>
              {!s.ready && (
                <span className="mt-2 inline-block text-xs text-neutral-600">
                  Bientôt
                </span>
              )}
            </>
          );
          return s.ready ? (
            <Link
              key={s.slug}
              href={`/dashboard/${guildId}/${s.slug}`}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-brand"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={s.slug}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 opacity-70"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </main>
  );
}
