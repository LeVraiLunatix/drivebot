"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { GuildBot } from "@/lib/bot";
import { useBotSelection } from "@/components/BotSelection";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { IconHome, IconHash, IconSettings, IconWave, IconMessage, IconShield, IconTicket, IconVerified, IconActivity, IconTag } from "@/components/ui/Icons";

interface NavItem { href: string; label: string; icon: ReactNode }
interface NavGroup { label: string | null; items: NavItem[] }

function BotAvatar({ bot, active, onClick }: { bot: GuildBot; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`bot-rail-item group ${active ? "is-active" : ""}`} aria-pressed={active} title={bot.name}>
    <span className="bot-rail-marker" />
    <span className="relative">
      {bot.avatarUrl ? <Image src={bot.avatarUrl} alt="" width={42} height={42} className="bot-rail-avatar" />
        : <span className="bot-rail-avatar grid place-items-center text-xs font-semibold">{bot.name.slice(0, 2).toUpperCase()}</span>}
      <span className={`bot-presence ${bot.online ? "is-online" : ""}`} />
    </span>
    <span className="bot-tooltip">{bot.name}</span>
  </button>;
}

export function Sidebar({ guildId, name, iconUrl, footer, bots }: {
  guildId: string; name: string; iconUrl: string | null; footer: ReactNode; bots: GuildBot[];
}) {
  const pathname = usePathname();
  const { selectedBot, selectedBotId, selectBot } = useBotSelection();
  const controlledBots = bots.filter((bot) => bot.controlled);
  const base = `/dashboard/${guildId}`;
  const groups: NavGroup[] = [
    { label: null, items: [{ href: base, label: "Vue d’ensemble", icon: <IconHome /> }] },
    { label: "Communauté", items: [
      { href: `${base}/server`, label: "Serveur & publications", icon: <IconHash /> },
      { href: `${base}/welcome`, label: "Bienvenue", icon: <IconWave /> },
      { href: `${base}/verification`, label: "Vérification", icon: <IconVerified /> },
      { href: `${base}/reaction-roles`, label: "Rôles", icon: <IconTag /> },
      { href: `${base}/suggestions`, label: "Suggestions", icon: <IconMessage /> },
    ] },
    { label: "Gestion", items: [
      { href: `${base}/moderation`, label: "Modération", icon: <IconShield /> },
      { href: `${base}/tickets`, label: "Tickets", icon: <IconTicket /> },
      { href: `${base}/embeds`, label: "Messages & embeds", icon: <IconMessage /> },
    ] },
    { label: "Centre de contrôle", items: [
      { href: `${base}/bots`, label: "Configurer le bot", icon: <IconActivity /> },
      { href: `${base}/status`, label: "État du système", icon: <IconActivity /> },
      { href: `${base}/settings`, label: "Paramètres", icon: <IconSettings /> },
    ] },
  ];
  const isActive = (href: string) => href === base ? pathname === base : pathname.startsWith(href);
  const navLink = (item: NavItem) => {
    const active = isActive(item.href);
    return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`sidebar-link ${active ? "is-active" : ""}`}>
      <span className="sidebar-link-icon">{item.icon}</span><span>{item.label}</span>
      {active && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
    </Link>;
  };
  const nav = <>{groups.map((group, index) => <div key={group.label ?? index} className={group.label ? "mt-5" : ""}>
    {group.label && <p className="eyebrow mb-2 px-3">{group.label}</p>}
    <div className="flex flex-col gap-1">{group.items.map(navLink)}</div>
  </div>)}</>;

  return <>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[19rem] border-r border-line bg-surface backdrop-blur-xl lg:flex">
      <div className="flex w-[4.75rem] flex-col items-center gap-3 border-r border-line bg-[var(--bg)]/70 py-4">
        <Link href={base} className="mb-2 grid size-11 place-items-center rounded-2xl bg-foreground font-semibold text-[var(--on-fg)] shadow-lg transition hover:-translate-y-0.5" title={name}>c.</Link>
        <div className="h-px w-8 bg-line" />
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-1">
          {controlledBots.map((bot) => <BotAvatar key={bot.id} bot={bot} active={bot.id === selectedBotId} onClick={() => selectBot(bot.id)} />)}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-line p-4">
          <div className="flex items-center gap-3">
            {selectedBot?.avatarUrl ? <Image src={selectedBot.avatarUrl} alt="" width={38} height={38} className="rounded-xl" />
              : iconUrl ? <Image src={iconUrl} alt="" width={38} height={38} className="rounded-xl" /> : null}
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{selectedBot?.name ?? "Cordsuite Bots"}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><span className={`size-1.5 rounded-full ${selectedBot?.online ? "bg-emerald-400" : "bg-zinc-500"}`} />{selectedBot?.online ? "Connecté" : "Disponible"}</p></div>
          </div>
        </div>
        <nav className="no-scrollbar flex-1 overflow-y-auto p-3">{nav}</nav>
        <div className="flex items-center justify-between border-t border-line p-3">{footer}<ThemeToggle /></div>
      </div>
    </aside>
    <div className="sticky top-0 z-30 border-b border-line bg-surface p-3 backdrop-blur-xl lg:hidden">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-3">
        <Link href={base} className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground font-semibold text-[var(--on-fg)]">c.</Link>
        <span className="mx-1 h-7 w-px shrink-0 bg-line" />
        {controlledBots.map((bot) => <BotAvatar key={bot.id} bot={bot} active={bot.id === selectedBotId} onClick={() => selectBot(bot.id)} />)}
        <span className="ml-auto flex shrink-0 gap-2">{footer}<ThemeToggle /></span>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto">{groups.flatMap((group) => group.items).map(navLink)}</nav>
    </div>
  </>;
}
