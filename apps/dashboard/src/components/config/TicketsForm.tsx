"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import {
  saveTicketsAction,
  publishPanelAction,
} from "@/app/dashboard/[guildId]/tickets/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { TicketsFormData } from "@/lib/config/tickets";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconMessage, IconSettings, IconSend } from "@/components/ui/Icons";

const hexToInt = (h: string) => parseInt(h.replace("#", ""), 16) || 0x5865f2;
const intToHex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

export function TicketsForm({
  guildId,
  meta,
  initial,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: TicketsFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [s, setS] = useState(initial);
  const [colorHex, setColorHex] = useState(intToHex(initial.panelColor));

  const set = <K extends keyof TicketsFormData>(k: K, v: TicketsFormData[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const channels = meta?.channels ?? [];
  const categories = meta?.categories ?? [];
  const roles = meta?.roles ?? [];

  const opt = (list: { id: string; name: string }[], selected: string | null, prefix = "") =>
    selected && !list.some((c) => c.id === selected)
      ? [{ id: selected, name: "actuel" }, ...list]
      : list;

  const toggleStaff = (id: string) =>
    set("staffRoleIds", s.staffRoleIds.includes(id) ? s.staffRoleIds.filter((r) => r !== id) : [...s.staffRoleIds, id]);
  const togglePing = (id: string) =>
    set("pingRoleIds", s.pingRoleIds.includes(id) ? s.pingRoleIds.filter((r) => r !== id) : [...s.pingRoleIds, id]);

  const roleChips = (selected: string[], toggle: (id: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {roles.length === 0 && <span className="text-sm text-neutral-500">Aucun rôle.</span>}
      {roles.map((r) => {
        const on = selected.includes(r.id);
        return (
          <button type="button" key={r.id} onClick={() => toggle(r.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-brand bg-brand/15 text-white" : "border-[var(--color-line)] text-neutral-300 hover:bg-white/5"}`}>
            <span className="size-2.5 rounded-full" style={{ backgroundColor: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99aab5" }} />
            {r.name}
          </button>
        );
      })}
    </div>
  );

  const payload = (): TicketsFormData => ({ ...s, panelColor: hexToInt(colorHex) });

  const save = () =>
    startTransition(async () => setMsg(await saveTicketsAction(guildId, payload())));
  const publish = () =>
    startTransition(async () => setMsg(await publishPanelAction(guildId)));

  return (
    <div className="flex flex-col gap-6">
      {!meta && (
        <p className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-300">
          Bot injoignable : listes de salons/rôles vides.
        </p>
      )}

      <SectionCard
        title="Système de tickets"
        description="Active le support par tickets sur ton serveur."
        icon={<IconMessage />}
        aside={<Toggle checked={s.enabled} onChange={(v) => set("enabled", v)} />}
      >
        <p className="text-sm text-neutral-500">
          Drivebot a besoin de la permission <b>Gérer les salons</b> pour créer les tickets.
        </p>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Panneau" description="L'embed avec le bouton d'ouverture." icon={<IconMessage />}>
          <div className="flex flex-col gap-4">
            <Field label="Salon du panneau">
              <select className="field-input" value={s.panelChannel ?? ""} onChange={(e) => set("panelChannel", e.target.value || null)}>
                <option value="">— Choisir —</option>
                {opt(channels, s.panelChannel).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </Field>
            <Field label="Titre"><input className="field-input" value={s.panelTitle} onChange={(e) => set("panelTitle", e.target.value)} /></Field>
            <Field label="Description"><textarea className="field-input" rows={3} value={s.panelDescription} onChange={(e) => set("panelDescription", e.target.value)} /></Field>
            <div className="flex gap-4">
              <Field label="Couleur"><input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-[var(--color-line)] bg-transparent" /></Field>
              <div className="flex-1"><Field label="Texte du bouton"><input className="field-input" value={s.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} /></Field></div>
              <Field label="Emoji"><input className="field-input w-16 text-center" value={s.buttonEmoji} onChange={(e) => set("buttonEmoji", e.target.value)} /></Field>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Aperçu du panneau</span>
          <div className="rounded-2xl bg-[#313338] p-4">
            <div className="rounded-lg border-l-4 bg-[#2b2d31] p-3" style={{ borderColor: colorHex }}>
              <p className="font-semibold text-white">{s.panelTitle || "Support"}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">{s.panelDescription}</p>
            </div>
            <button type="button" className="mt-2 rounded bg-brand px-3 py-1.5 text-sm font-medium text-white" disabled>
              {s.buttonEmoji} {s.buttonLabel || "Ouvrir un ticket"}
            </button>
          </div>
          <button type="button" onClick={publish} disabled={pending} className="btn-ghost justify-center">
            <IconSend width={18} height={18} /> Publier le panneau dans le salon
          </button>
          <p className="text-xs text-neutral-600">Enregistre d'abord tes réglages, puis publie.</p>
        </div>
      </div>

      <SectionCard title="Comportement" description="Où et pour qui les tickets sont créés." icon={<IconSettings />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie des tickets">
            <select className="field-input" value={s.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
              <option value="">— Aucune —</option>
              {opt(categories, s.categoryId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Salon de logs">
            <select className="field-input" value={s.logChannel ?? ""} onChange={(e) => set("logChannel", e.target.value || null)}>
              <option value="">— Aucun —</option>
              {opt(channels, s.logChannel).map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tickets ouverts max / membre">
            <input type="number" min={1} max={10} className="field-input" value={s.maxOpen} onChange={(e) => set("maxOpen", Number(e.target.value))} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Message d'ouverture" hint="Variables : {user} · {username} · {server}">
            <textarea className="field-input" rows={2} value={s.openMessage} onChange={(e) => set("openMessage", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">Rôles staff (voient et gèrent les tickets)</span>
          {roleChips(s.staffRoleIds, toggleStaff)}
        </div>
        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">Rôles mentionnés à l'ouverture (ping)</span>
          {roleChips(s.pingRoleIds, togglePing)}
        </div>
      </SectionCard>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}
