"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  useEffect(() => {
    const hasExplicitSelection = localStorage.getItem("cordsuite-selected-bot");
    if (!hasExplicitSelection && assignedBotId && bots.some((bot) => bot.id === assignedBotId)) {
      selectBot(assignedBotId);
    }
    // Une affectation enregistrée sert uniquement de valeur initiale. Le choix dans la barre reste prioritaire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const controlled = bots.filter((bot) => bot.controlled);
  return (
    <label className="bot-picker">
      <span className="eyebrow">{label}</span>
      <span className="bot-picker-control">
        {controlled.find((bot) => bot.id === selectedBotId)?.avatarUrl && (
          <Image src={controlled.find((bot) => bot.id === selectedBotId)!.avatarUrl} alt="" width={28} height={28} className="rounded-lg" />
        )}
        <select value={selectedBotId} onChange={(event) => selectBot(event.target.value)} aria-label={label}>
          {controlled.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
        </select>
      </span>
    </label>
  );
}
