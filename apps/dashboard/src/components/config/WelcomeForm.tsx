"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import { saveWelcome, type SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { WelcomeFormData } from "@/lib/config/welcome";

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand";

export function WelcomeForm({
  guildId,
  meta,
  initial,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: WelcomeFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);

  const [joinEnabled, setJoinEnabled] = useState(initial.joinEnabled);
  const [joinChannel, setJoinChannel] = useState(initial.joinChannel ?? "");
  const [joinMessage, setJoinMessage] = useState(initial.joinMessage);
  const [leaveEnabled, setLeaveEnabled] = useState(initial.leaveEnabled);
  const [leaveChannel, setLeaveChannel] = useState(initial.leaveChannel ?? "");
  const [leaveMessage, setLeaveMessage] = useState(initial.leaveMessage);
  const [autoRoleIds, setAutoRoleIds] = useState<string[]>(initial.autoRoleIds);

  const channels = meta?.channels ?? [];
  const roles = meta?.roles ?? [];

  const toggleRole = (id: string) =>
    setAutoRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  // Garde le salon sélectionné visible même si la liste du bot est vide/indispo.
  const channelOptions = (selected: string) =>
    selected && !channels.some((c) => c.id === selected)
      ? [{ id: selected, name: "salon actuel" }, ...channels]
      : channels;

  const save = () =>
    startTransition(async () => {
      const r = await saveWelcome(guildId, {
        joinEnabled,
        joinChannel: joinChannel || null,
        joinMessage,
        leaveEnabled,
        leaveChannel: leaveChannel || null,
        leaveMessage,
        autoRoleIds,
      });
      setMsg(r);
    });

  return (
    <div className="flex flex-col gap-8">
      {!meta && (
        <p className="rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-300">
          Bot injoignable : les listes de salons et rôles sont vides. Démarre le
          bot pour les charger.
        </p>
      )}

      {/* Bienvenue */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={joinEnabled}
            onChange={(e) => setJoinEnabled(e.target.checked)}
          />
          Activer le message de bienvenue
        </label>
        {!joinEnabled && (
          <p className="mt-2 text-xs text-amber-400">
            Coche cette case pour que le message soit envoyé aux arrivées.
          </p>
        )}
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Salon</span>
            <select
              value={joinChannel}
              onChange={(e) => setJoinChannel(e.target.value)}
              className={inputCls}
            >
              <option value="">— Choisir un salon —</option>
              {channelOptions(joinChannel).map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Message</span>
            <textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              rows={2}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Variables : <code>{"{user}"}</code> <code>{"{username}"}</code>{" "}
              <code>{"{server}"}</code> <code>{"{memberCount}"}</code>
            </p>
          </div>
        </div>
      </section>

      {/* Départ */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={leaveEnabled}
            onChange={(e) => setLeaveEnabled(e.target.checked)}
          />
          Activer le message de départ
        </label>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Salon</span>
            <select
              value={leaveChannel}
              onChange={(e) => setLeaveChannel(e.target.value)}
              className={inputCls}
            >
              <option value="">— Choisir un salon —</option>
              {channelOptions(leaveChannel).map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Message</span>
            <textarea
              value={leaveMessage}
              onChange={(e) => setLeaveMessage(e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* Autorôles */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="font-medium">Rôles automatiques</p>
        <p className="mt-1 text-xs text-neutral-400">
          Attribués à chaque nouveau membre.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.length === 0 && (
            <span className="text-sm text-neutral-500">Aucun rôle disponible.</span>
          )}
          {roles.map((r) => {
            const checked = autoRoleIds.includes(r.id);
            return (
              <label
                key={r.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                  checked ? "border-brand bg-brand/10" : "border-neutral-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleRole(r.id)}
                />
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99aab5" }}
                />
                {r.name}
              </label>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {msg?.message && (
          <span className={msg.ok ? "text-sm text-green-400" : "text-sm text-red-400"}>
            {msg.message}
          </span>
        )}
      </div>
    </div>
  );
}
