"use client";

import { useState, useTransition } from "react";
import type { BotStatus, GuildMeta } from "@drivebot/types";
import { saveStatusAction } from "@/app/dashboard/[guildId]/status/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { StatusFormData } from "@/lib/config/status";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconActivity } from "@/components/ui/Icons";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}

function LiveStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export function StatusForm({
  guildId,
  meta,
  initial,
  status,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: StatusFormData;
  status: BotStatus | null;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [channelId, setChannelId] = useState(initial.channelId ?? "");

  const channels = meta?.channels ?? [];
  const channelOptions =
    channelId && !channels.some((c) => c.id === channelId)
      ? [{ id: channelId, name: "salon actuel" }, ...channels]
      : channels;

  const save = () =>
    startTransition(async () => {
      setMsg(await saveStatusAction(guildId, { enabled, channelId: channelId || null }));
    });

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="État en direct"
        description="Ce que voit Drivebot en ce moment."
        icon={<IconActivity />}
        aside={
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
              status ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            <span className={`size-2 rounded-full ${status ? "bg-emerald-400" : "bg-red-400"}`} />
            {status ? "En ligne" : "Hors ligne"}
          </span>
        }
      >
        {status ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LiveStat value={`${status.pingMs} ms`} label="Ping" />
            <LiveStat value={formatUptime(status.uptimeSeconds)} label="Uptime" />
            <LiveStat value={`${status.guildCount}`} label="Serveurs" />
            <LiveStat value={`${status.memoryMb} MB`} label="Mémoire" />
            <LiveStat value={`${status.memberCount}`} label="Membres" />
            <LiveStat value={status.dbOk ? "✅ OK" : "❌ Erreur"} label="Base de données" />
            <LiveStat value={new Date(status.startedAt).toLocaleString("fr-FR")} label="Dernier redémarrage" />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Drivebot ne répond pas actuellement.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Rapport automatique"
        description="Poste ces mêmes infos dans un salon toutes les 30 minutes."
        icon={<IconActivity />}
        aside={<Toggle checked={enabled} onChange={setEnabled} />}
      >
        <Field label="Salon (ex. logs-et-techniques)">
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="field-input">
            <option value="">— Choisir un salon —</option>
            {channelOptions.map((c) => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </Field>
      </SectionCard>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}
