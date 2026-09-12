import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta, getGuildBots } from "@/lib/bot";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/AuthButtons";
import { BotSelectionProvider } from "@/components/BotSelection";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);
  const [meta, bots] = await Promise.all([getGuildMeta(guildId), getGuildBots(guildId)]);
  const iconUrl = meta?.icon
    ? `https://cdn.discordapp.com/icons/${guildId}/${meta.icon}.png?size=128`
    : null;

  return (
    <BotSelectionProvider bots={bots?.filter((bot) => bot.controlled) ?? []}>
    <div className="lg:pl-[19rem]">
      <Sidebar
        guildId={guildId}
        name={guild.name}
        iconUrl={iconUrl}
        footer={<SignOutButton />}
        bots={bots ?? []}
      />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
    </BotSelectionProvider>
  );
}
