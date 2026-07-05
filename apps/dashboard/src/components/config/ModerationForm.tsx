"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import { saveModerationAction } from "@/app/dashboard/[guildId]/moderation/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { ModerationFormData } from "@/lib/config/moderation";

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand";

export function ModerationForm({
  guildId,
  meta,
  initial,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: ModerationFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [logEnabled, setLogEnabled] = useState(initial.logEnabled);
  const [logChannel, setLogChannel] = useState(initial.logChannel ?? "");

  const channels = meta?.channels ?? [];
  const channelOptions =
    logChannel && !channels.some((c) => c.id === logChannel)
      ? [{ id: logChannel, name: "salon actuel" }, ...channels]
      : channels;

  const save = () =>
    startTransition(async () => {
      const r = await saveModerationAction(guildId, {
        logEnabled,
        logChannel: logChannel || null,
      });
      setMsg(r);
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={logEnabled}
            onChange={(e) => setLogEnabled(e.target.checked)}
          />
          Journaliser les sanctions
        </label>
        <div className="mt-4">
          <span className="mb-1 block text-xs text-neutral-400">Salon de logs</span>
          <select
            value={logChannel}
            onChange={(e) => setLogChannel(e.target.value)}
            className={inputCls}
          >
            <option value="">— Choisir un salon —</option>
            {channelOptions.map((c) => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Les commandes <code>/kick</code>, <code>/ban</code>, <code>/warn</code>,{" "}
          <code>/timeout</code> enregistrent une entrée et la postent ici.
        </p>
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
