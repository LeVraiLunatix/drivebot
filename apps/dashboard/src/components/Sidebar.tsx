"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  IconHome,
  IconSettings,
  IconWave,
  IconMessage,
  IconShield,
  IconTicket,
  IconVerified,
  IconActivity,
  IconTag,
} from "@/components/ui/Icons";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export function Sidebar({
  guildId,
  name,
  iconUrl,
  footer,
}: {
  guildId: string;
  name: string;
  iconUrl: string | null;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/dashboard/${guildId}`;

  /* Regroupé par moment de la vie du serveur plutôt qu'en liste plate : à neuf
     entrées, une colonne sans repères devient un mur. */
  const groups: NavGroup[] = [
    { label: null, items: [{ href: base, label: "Vue d'ensemble", icon: <IconHome /> }] },
    {
      label: "Arrivée",
      items: [
        { href: `${base}/welcome`, label: "Bienvenue", icon: <IconWave /> },
        { href: `${base}/verification`, label: "Vérification", icon: <IconVerified /> },
      ],
    },
    {
      label: "Animation",
      items: [
        { href: `${base}/reaction-roles`, label: "Rôles à la carte", icon: <IconTag /> },
        { href: `${base}/embeds`, label: "Embeds", icon: <IconMessage /> },
        { href: `${base}/suggestions`, label: "Suggestions", icon: <IconMessage /> },
      ],
    },
    {
      label: "Modération",
      items: [
        { href: `${base}/moderation`, label: "Modération & logs", icon: <IconShield /> },
        { href: `${base}/tickets`, label: "Tickets", icon: <IconTicket /> },
      ],
    },
    {
      label: "Système",
      items: [
        { href: `${base}/bots`, label: "Mes bots", icon: <IconActivity /> },
        { href: `${base}/settings`, label: "Paramètres", icon: <IconSettings /> },
        { href: `${base}/status`, label: "Statut du bot", icon: <IconActivity /> },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);

  const link = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        /* `shrink-0` : la nav mobile est un flex qui défile horizontalement —
           sans ça les libellés se compressent les uns sur les autres. */
        className="relative flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[var(--radius)] px-3 py-2 text-sm transition"
        style={{
          background: active ? "var(--wash)" : undefined,
          color: active ? "var(--fg)" : "var(--muted)",
          fontWeight: active ? 500 : 400,
        }}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full"
            style={{ background: "linear-gradient(var(--accent), var(--accent-2))" }}
          />
        )}
        <span style={{ color: active ? "var(--accent)" : "inherit", opacity: active ? 1 : 0.7 }}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  const nav = (
    <>
      {groups.map((g, i) => (
        <div key={g.label ?? i} className={g.label ? "mt-5" : undefined}>
          {g.label && <p className="eyebrow mb-2 px-3">{g.label}</p>}
          <div className="flex flex-col gap-0.5">{g.items.map(link)}</div>
        </div>
      ))}
    </>
  );

  const Header = (
    <div className="flex items-center gap-3 px-2">
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-[var(--radius)] border"
          style={{ borderColor: "var(--line)" }}
        />
      ) : (
        <div
          className="grid size-10 place-items-center rounded-[var(--radius)] border font-mono text-xs font-semibold"
          style={{ borderColor: "var(--line)", background: "var(--wash)", color: "var(--accent)" }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="eyebrow">Drivebot</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col gap-6 overflow-y-auto border-r p-4 backdrop-blur-md lg:flex"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        {Header}
        <nav className="flex-1">{nav}</nav>
        <div
          className="flex items-center justify-between gap-2 border-t pt-3"
          style={{ borderColor: "var(--line)" }}
        >
          {footer}
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile : barre supérieure */}
      <div
        className="sticky top-0 z-20 border-b p-3 backdrop-blur-md lg:hidden"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          {Header}
          <div className="flex items-center gap-2">
            {footer}
            <ThemeToggle />
          </div>
        </div>
        <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {groups.flatMap((g) => g.items).map(link)}
        </nav>
      </div>
    </>
  );
}
