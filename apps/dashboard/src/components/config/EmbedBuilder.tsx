"use client";

import { useState, useTransition } from "react";
import type { EmbedData, GuildMeta } from "@drivebot/types";
import type { EmbedTemplateDto } from "@/lib/config/embeds";
import {
  sendEmbedAction,
  saveTemplateAction,
  deleteTemplateAction,
} from "@/app/dashboard/[guildId]/embeds/actions";
import { Field } from "@/components/ui/Card";
import { IconSend, IconTrash } from "@/components/ui/Icons";

interface EmbedFieldRow {
  name: string;
  value: string;
  inline: boolean;
}
interface BuilderState {
  title: string;
  description: string;
  url: string;
  colorHex: string;
  authorName: string;
  thumbnail: string;
  image: string;
  footerText: string;
  fields: EmbedFieldRow[];
}

const EMPTY: BuilderState = {
  title: "",
  description: "",
  url: "",
  colorHex: "#5865f2",
  authorName: "",
  thumbnail: "",
  image: "",
  footerText: "",
  fields: [],
};

function fromEmbedData(d: EmbedData): BuilderState {
  return {
    title: d.title ?? "",
    description: d.description ?? "",
    url: d.url ?? "",
    colorHex: typeof d.color === "number" ? `#${d.color.toString(16).padStart(6, "0")}` : "#5865f2",
    authorName: d.author?.name ?? "",
    thumbnail: d.thumbnail?.url ?? "",
    image: d.image?.url ?? "",
    footerText: d.footer?.text ?? "",
    fields: (d.fields ?? []).map((f) => ({ name: f.name, value: f.value, inline: !!f.inline })),
  };
}

function toEmbedData(s: BuilderState): EmbedData {
  const d: EmbedData = {};
  if (s.title) d.title = s.title;
  if (s.description) d.description = s.description;
  if (s.url) d.url = s.url;
  d.color = parseInt(s.colorHex.replace("#", ""), 16) || 0x5865f2;
  if (s.authorName) d.author = { name: s.authorName };
  if (s.thumbnail) d.thumbnail = { url: s.thumbnail };
  if (s.image) d.image = { url: s.image };
  if (s.footerText) d.footer = { text: s.footerText };
  const fields = s.fields.filter((f) => f.name && f.value);
  if (fields.length) d.fields = fields;
  return d;
}

export function EmbedBuilder({
  guildId,
  meta,
  templates,
}: {
  guildId: string;
  meta: GuildMeta | null;
  templates: EmbedTemplateDto[];
}) {
  const [s, setS] = useState<BuilderState>(EMPTY);
  const [channelId, setChannelId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof BuilderState>(k: K, v: BuilderState[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const channels = meta?.channels ?? [];
  const embed = toEmbedData(s);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
    });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Éditeur */}
      <div className="card flex flex-col gap-4 p-5">
        <Field label="Titre">
          <input className="field-input" value={s.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea className="field-input" rows={4} value={s.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="flex items-end gap-4">
          <Field label="Couleur">
            <input type="color" value={s.colorHex} onChange={(e) => set("colorHex", e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-[var(--color-line)] bg-transparent" />
          </Field>
          <div className="flex-1">
            <Field label="URL du titre">
              <input className="field-input" value={s.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
            </Field>
          </div>
        </div>
        <Field label="Auteur">
          <input className="field-input" value={s.authorName} onChange={(e) => set("authorName", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Miniature (URL)">
            <input className="field-input" value={s.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Image (URL)">
            <input className="field-input" value={s.image} onChange={(e) => set("image", e.target.value)} placeholder="https://" />
          </Field>
        </div>
        <Field label="Pied de page">
          <input className="field-input" value={s.footerText} onChange={(e) => set("footerText", e.target.value)} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Champs</span>
            <button
              type="button"
              onClick={() => set("fields", [...s.fields, { name: "", value: "", inline: false }])}
              className="rounded-lg border border-[var(--color-line)] px-2.5 py-1 text-xs hover:bg-white/5"
            >
              + Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {s.fields.map((f, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-line)] p-3">
                <div className="flex gap-2">
                  <input className="field-input" placeholder="Nom" value={f.name} onChange={(e) => {
                    const next = [...s.fields]; next[i] = { ...f, name: e.target.value }; set("fields", next);
                  }} />
                  <button type="button" onClick={() => set("fields", s.fields.filter((_, j) => j !== i))} className="px-2 text-neutral-500 hover:text-red-400">
                    <IconTrash width={18} height={18} />
                  </button>
                </div>
                <input className="field-input mt-2" placeholder="Valeur" value={f.value} onChange={(e) => {
                  const next = [...s.fields]; next[i] = { ...f, value: e.target.value }; set("fields", next);
                }} />
                <label className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                  <input type="checkbox" checked={f.inline} onChange={(e) => {
                    const next = [...s.fields]; next[i] = { ...f, inline: e.target.checked }; set("fields", next);
                  }} /> En ligne
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aperçu + actions */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Aperçu en direct</span>
        <EmbedPreview s={s} />

        <div className="card flex flex-col gap-3 p-5">
          <Field label="Envoyer dans">
            <select className="field-input" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              <option value="">— Choisir un salon —</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </Field>
          <button type="button" disabled={pending} onClick={() => run(() => sendEmbedAction(guildId, channelId, embed))} className="btn-primary">
            <IconSend width={18} height={18} /> {pending ? "…" : "Envoyer l'embed"}
          </button>
          <div className="flex gap-2">
            <input className="field-input" placeholder="Nom du modèle" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            <button type="button" disabled={pending} onClick={() => run(() => saveTemplateAction(guildId, templateName, embed))} className="btn-ghost whitespace-nowrap">
              Enregistrer
            </button>
          </div>
          {msg && (
            <span className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>
          )}
        </div>

        {templates.length > 0 && (
          <div className="card p-5">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Modèles enregistrés</span>
            <ul className="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                  <button type="button" className="hover:text-brand" onClick={() => setS(fromEmbedData(t.data))}>
                    {t.name}
                  </button>
                  <button type="button" disabled={pending} onClick={() => run(() => deleteTemplateAction(guildId, t.id))} className="text-neutral-500 hover:text-red-400">
                    <IconTrash width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function EmbedPreview({ s }: { s: BuilderState }) {
  const shown = s.fields.filter((f) => f.name || f.value);
  return (
    <div className="rounded-2xl bg-[#313338] p-4 shadow-inner">
      <div className="flex gap-3 rounded-lg border-l-4 bg-[#2b2d31] p-3" style={{ borderColor: s.colorHex }}>
        <div className="min-w-0 flex-1">
          {s.authorName && <p className="text-sm font-semibold text-white">{s.authorName}</p>}
          {s.title && <p className="mt-0.5 font-semibold text-[#00a8fc]">{s.title}</p>}
          {s.description && <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">{s.description}</p>}
          {shown.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {shown.map((f, i) => (
                <div key={i} className={f.inline ? "" : "col-span-2"}>
                  <p className="text-xs font-semibold text-white">{f.name}</p>
                  <p className="text-xs text-[#dbdee1]">{f.value}</p>
                </div>
              ))}
            </div>
          )}
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="mt-3 max-h-48 rounded-lg" />
          )}
          {s.footerText && <p className="mt-2 text-xs text-[#949ba4]">{s.footerText}</p>}
        </div>
        {s.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.thumbnail} alt="" className="size-16 rounded-lg object-cover" />
        )}
      </div>
    </div>
  );
}
