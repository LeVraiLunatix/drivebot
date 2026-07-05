"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/dashboard/[guildId]/settings/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { SettingsFormData } from "@/lib/config/settings";
import { SectionCard, Field } from "@/components/ui/Card";
import { IconCheck } from "@/components/ui/Icons";

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
      setMsg(await saveSettingsAction(guildId, { locale, prefix }));
    });

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title="Général" description="Réglages de base du bot sur ce serveur.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Langue du bot">
            <select value={locale} onChange={(e) => setLocale(e.target.value as "FR" | "EN")} className="field-input">
              <option value="FR">🇫🇷 Français</option>
              <option value="EN">🇬🇧 English</option>
            </select>
          </Field>
          <Field label="Préfixe" hint="Pour les commandes texte (5 caractères max).">
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={5} className="field-input" />
          </Field>
        </div>
      </SectionCard>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}

export function SaveBar({
  pending,
  msg,
  onSave,
}: {
  pending: boolean;
  msg: SaveState | null;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-4 flex items-center gap-3">
      <button onClick={onSave} disabled={pending} className="btn-primary">
        {pending ? "Enregistrement…" : (<><IconCheck width={18} height={18} /> Enregistrer</>)}
      </button>
      {msg?.message && (
        <span className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.message}</span>
      )}
    </div>
  );
}
