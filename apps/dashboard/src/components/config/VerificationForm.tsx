"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import {
  saveVerificationAction,
  publishVerifPanelAction,
} from "@/app/dashboard/[guildId]/verification/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { VerificationFormData } from "@/lib/config/verification";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconShield, IconSend } from "@/components/ui/Icons";

const hexToInt = (h: string) => parseInt(h.replace("#", ""), 16) || 0x5865f2;
const intToHex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

export function VerificationForm({
  guildId,
  meta,
  initial,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: VerificationFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [s, setS] = useState(initial);
  const [colorHex, setColorHex] = useState(intToHex(initial.panelColor));

  const set = <K extends keyof VerificationFormData>(k: K, v: VerificationFormData[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const channels = meta?.channels ?? [];
  const roles = meta?.roles ?? [];
  const optC = (sel: string | null) =>
    sel && !channels.some((c) => c.id === sel) ? [{ id: sel, name: "actuel" }, ...channels] : channels;
  const optR = (sel: string | null) =>
    sel && !roles.some((r) => r.id === sel) ? [{ id: sel, name: "actuel", color: 0 }, ...roles] : roles;

  const payload = (): VerificationFormData => ({ ...s, panelColor: hexToInt(colorHex) });
  const save = () => startTransition(async () => setMsg(await saveVerificationAction(guildId, payload())));
  const publish = () => startTransition(async () => setMsg(await publishVerifPanelAction(guildId)));

  return (
    <div className="flex flex-col gap-6">
      {!meta && (
        <p className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-300">
          Bot injoignable : listes de salons/rôles vides.
        </p>
      )}

      <SectionCard
        title="Vérification à l'entrée"
        description="Un captcha à bouton bloque les bots avant l'accès au serveur."
        icon={<IconShield />}
        aside={<Toggle checked={s.enabled} onChange={(v) => set("enabled", v)} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Salon de vérification">
            <select className="field-input" value={s.channelId ?? ""} onChange={(e) => set("channelId", e.target.value || null)}>
              <option value="">— Choisir —</option>
              {optC(s.channelId).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </Field>
          <div />
          <Field label="Rôle donné après vérification" hint="Le rôle qui débloque le serveur.">
            <select className="field-input" value={s.verifiedRoleId ?? ""} onChange={(e) => set("verifiedRoleId", e.target.value || null)}>
              <option value="">— Aucun —</option>
              {optR(s.verifiedRoleId).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Rôle « non vérifié » (optionnel)" hint="Donné à l'arrivée, retiré après vérif.">
            <select className="field-input" value={s.unverifiedRoleId ?? ""} onChange={(e) => set("unverifiedRoleId", e.target.value || null)}>
              <option value="">— Aucun —</option>
              {optR(s.unverifiedRoleId).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Panneau" description="L'embed affiché avec le bouton de vérification." icon={<IconShield />}>
          <div className="flex flex-col gap-4">
            <Field label="Titre"><input className="field-input" value={s.panelTitle} onChange={(e) => set("panelTitle", e.target.value)} /></Field>
            <Field label="Description"><textarea className="field-input" rows={3} value={s.panelDescription} onChange={(e) => set("panelDescription", e.target.value)} /></Field>
            <Field label="Couleur"><input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-[var(--color-line)] bg-transparent" /></Field>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Aperçu</span>
          <div className="rounded-2xl bg-[#313338] p-4">
            <div className="rounded-lg border-l-4 bg-[#2b2d31] p-3" style={{ borderColor: colorHex }}>
              <p className="font-semibold text-white">{s.panelTitle || "Vérification"}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">{s.panelDescription}</p>
            </div>
            <button type="button" className="mt-2 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white" disabled>✅ Se vérifier</button>
          </div>
          <button type="button" onClick={publish} disabled={pending} className="btn-ghost justify-center">
            <IconSend width={18} height={18} /> Publier le panneau dans le salon
          </button>
          <p className="text-xs text-neutral-600">Enregistre d'abord, puis publie.</p>
        </div>
      </div>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}
