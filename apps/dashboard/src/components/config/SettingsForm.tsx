"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/dashboard/[guildId]/settings/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { SettingsFormData } from "@/lib/config/settings";

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand";

export function SettingsForm({
  guildId,
  initial,
}: {
  guildId: string;
  initial: SettingsFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [locale, setLocale] = useState(initial.locale);
  const [prefix, setPrefix] = useState(initial.prefix);

  const save = () =>
    startTransition(async () => {
      const r = await saveSettingsAction(guildId, { locale, prefix });
      setMsg(r);
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Langue du bot</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "FR" | "EN")}
              className={inputCls}
            >
              <option value="FR">Français</option>
              <option value="EN">English</option>
            </select>
          </div>
          <div>
            <span className="mb-1 block text-xs text-neutral-400">
              Préfixe des commandes texte
            </span>
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              maxLength={5}
              className={`${inputCls} max-w-24`}
            />
          </div>
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
