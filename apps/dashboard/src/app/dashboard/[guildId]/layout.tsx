import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/AuthButtons";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);
  const meta = await getGuildMeta(guildId);
  const iconUrl = meta?.icon
    ? `https://cdn.discordapp.com/icons/${guildId}/${meta.icon}.png?size=128`
    : null;

  return (
    <div className="lg:pl-64">
      <Sidebar
        guildId={guildId}
        name={guild.name}
        iconUrl={iconUrl}
        footer={<SignOutButton />}
      />
      <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
