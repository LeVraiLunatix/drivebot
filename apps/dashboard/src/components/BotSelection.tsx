"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import type { GuildBot } from "@/lib/bot";

type BotSelectionValue = {
  bots: GuildBot[];
  selectedBot: GuildBot | null;
  selectedBotId: string;
  selectBot: (id: string) => void;
};

const BotSelectionContext = createContext<BotSelectionValue | null>(null);

export function BotSelectionProvider({ bots, children }: { bots: GuildBot[]; children: ReactNode }) {
  const fallback = bots.find((bot) => bot.primary)?.id ?? bots[0]?.id ?? "";
  const [selectedBotId, setSelectedBotId] = useState(fallback);

  useEffect(() => {
    const stored = localStorage.getItem("cordsuite-selected-bot");
    if (stored && bots.some((bot) => bot.id === stored)) setSelectedBotId(stored);
  }, [bots]);

  const selectBot = (id: string) => {
    if (!bots.some((bot) => bot.id === id)) return;
    setSelectedBotId(id);
    localStorage.setItem("cordsuite-selected-bot", id);
  };
  const value = useMemo(() => ({
    bots,
    selectedBotId,
    selectedBot: bots.find((bot) => bot.id === selectedBotId) ?? null,
    selectBot,
  }), [bots, selectedBotId]);

  return <BotSelectionContext.Provider value={value}>{children}</BotSelectionContext.Provider>;
}

export function useBotSelection() {
  const value = useContext(BotSelectionContext);
  if (!value) throw new Error("BotSelectionProvider manquant.");
  return value;
}

export function BotPicker({ label = "Bot émetteur", assignedBotId }: { label?: string; assignedBotId?: string | null }) {
  const { bots, selectedBotId, selectBot } = useBotSelection();
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hasExplicitSelection = localStorage.getItem("cordsuite-selected-bot");
    if (!hasExplicitSelection && assignedBotId && bots.some((bot) => bot.id === assignedBotId)) {
      selectBot(assignedBotId);
    }
    // Une affectation enregistrée sert uniquement de valeur initiale. Le choix dans la barre reste prioritaire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const controlled = bots.filter((bot) => bot.controlled);
  const selected = controlled.find((bot) => bot.id === selectedBotId) ?? controlled[0] ?? null;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const choose = (id: string) => {
    selectBot(id);
    setOpen(false);
  };

  return (
    <div className="bot-picker" ref={pickerRef}>
      <span className="eyebrow">{label}</span>
      <div className="bot-menu-wrap">
        <button
          type="button"
          className="bot-menu-trigger"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {selected && <BotMenuAvatar bot={selected} />}
          <span className="min-w-0 flex-1 truncate text-left">{selected?.name ?? "Choisir un bot"}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={`bot-menu-chevron ${open ? "is-open" : ""}`}>
            <path d="m5.5 7.5 4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </button>
        {open && (
          <div className="bot-menu-panel" role="listbox" aria-label={label}>
            <div className="bot-menu-heading">
              <span>Sélectionner un bot</span>
              <span>{controlled.length}</span>
            </div>
            <div className="bot-menu-list no-scrollbar">
              {controlled.map((bot) => {
                const active = bot.id === selectedBotId;
                const status = bot.online ? "En ligne" : bot.preferences?.enabled ? "Hors ligne" : "Désactivé";
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    key={bot.id}
                    className={`bot-menu-option ${active ? "is-active" : ""}`}
                    onClick={() => choose(bot.id)}
                  >
                    <BotMenuAvatar bot={bot} />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-semibold">{bot.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-muted">
                        <span className={`size-1.5 rounded-full ${bot.online ? "bg-emerald-400" : "bg-zinc-500"}`} />
                        {status}
                      </span>
                    </span>
                    {active && (
                      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 shrink-0 text-accent">
                        <path d="m4 10.5 3.5 3.5L16 5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BotMenuAvatar({ bot }: { bot: GuildBot }) {
  return bot.avatarUrl ? (
    <Image src={bot.avatarUrl} alt="" width={32} height={32} className="bot-menu-avatar" />
  ) : (
    <span className="bot-menu-avatar grid place-items-center text-[0.65rem] font-bold">
      {bot.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
