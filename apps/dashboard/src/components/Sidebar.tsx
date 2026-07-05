"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconHome,
  IconSettings,
  IconWave,
  IconMessage,
  IconShield,
  IconTicket,
  IconVerified,
} from "@/components/ui/Icons";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
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

  const items: NavItem[] = [
    { href: base, label: "Vue d'ensemble", icon: <IconHome /> },
    { href: `${base}/settings`, label: "Paramètres", icon: <IconSettings /> },
    { href: `${base}/welcome`, label: "Bienvenue", icon: <IconWave /> },
    { href: `${base}/verification`, label: "Vérification", icon: <IconVerified /> },
    { href: `${base}/tickets`, label: "Tickets", icon: <IconTicket /> },
    { href: `${base}/embeds`, label: "Embeds", icon: <IconMessage /> },
    { href: `${base}/moderation`, label: "Modération", icon: <IconShield /> },
  ];

  const isActive = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href);

  const link = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-brand/15 text-white"
            : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
        }`}
      >
        <span className={active ? "text-brand" : "text-neutral-500"}>{item.icon}</span>
        {item.label}
      </Link>
    );
  };

  const Header = (
    <div className="flex items-center gap-3 px-2">
      {iconUrl ? (
        <Image src={iconUrl} alt="" width={40} height={40} className="size-10 rounded-xl" />
      ) : (
        <div className="grid size-10 place-items-center rounded-xl bg-brand/20 text-sm font-bold text-brand">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-neutral-100">{name}</p>
        <p className="text-xs text-neutral-500">Drivebot</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col gap-6 border-r border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 backdrop-blur-md lg:flex">
        {Header}
        <nav className="flex flex-1 flex-col gap-1">{items.map(link)}</nav>
        {footer}
      </aside>

      {/* Mobile : barre supérieure */}
      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)]/60 p-3 backdrop-blur-md lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          {Header}
          {footer}
        </div>
        <nav className="flex gap-1 overflow-x-auto">{items.map(link)}</nav>
      </div>
    </>
  );
}
