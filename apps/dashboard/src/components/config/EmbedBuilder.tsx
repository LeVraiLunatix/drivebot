"use client";

import { useState, useTransition } from "react";
import type { EmbedData } from "@drivebot/types";
import type { GuildMeta } from "@drivebot/types";
import type { EmbedTemplateDto } from "@/lib/config/embeds";
import {
  sendEmbedAction,
  saveTemplateAction,
  deleteTemplateAction,
} from "@/app/dashboard/[guildId]/embeds/actions";

interface Field {
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
  fields: Field[];
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

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-brand";

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
    setS((prev) => ({ ...prev, [k]: v }));

  const channels = meta?.channels ?? [];
  const embed = toEmbedData(s);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
    });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Éditeur */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-1 block text-xs text-neutral-400">Titre</span>
          <input className={inputCls} value={s.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <span className="mb-1 block text-xs text-neutral-400">Description</span>
          <textarea className={inputCls} rows={4} value={s.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="flex gap-4">
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Couleur</span>
            <input type="color" value={s.colorHex} onChange={(e) => set("colorHex", e.target.value)} className="h-10 w-16 rounded bg-transparent" />
          </div>
          <div className="flex-1">
            <span className="mb-1 block text-xs text-neutral-400">URL du titre</span>
            <input className={inputCls} value={s.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs text-neutral-400">Auteur</span>
          <input className={inputCls} value={s.authorName} onChange={(e) => set("authorName", e.target.value)} />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <span className="mb-1 block text-xs text-neutral-400">Miniature (URL)</span>
            <input className={inputCls} value={s.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://" />
          </div>
          <div className="flex-1">
            <span className="mb-1 block text-xs text-neutral-400">Image (URL)</span>
            <input className={inputCls} value={s.image} onChange={(e) => set("image", e.target.value)} placeholder="https://" />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs text-neutral-400">Pied de page</span>
          <input className={inputCls} value={s.footerText} onChange={(e) => set("footerText", e.target.value)} />
        </div>

        {/* Champs */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Champs</span>
            <button
              type="button"
              onClick={() => set("fields", [...s.fields, { name: "", value: "", inline: false }])}
              className="rounded border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800"
            >
              + Ajouter
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {s.fields.map((f, i) => (
              <div key={i} className="rounded-lg border border-neutral-800 p-2">
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="Nom" value={f.name} onChange={(e) => {
                    const next = [...s.fields]; next[i] = { ...f, name: e.target.value }; set("fields", next);
                  }} />
                  <button type="button" onClick={() => set("fields", s.fields.filter((_, j) => j !== i))} className="px-2 text-neutral-500 hover:text-red-400">✕</button>
                </div>
                <input className={`${inputCls} mt-2`} placeholder="Valeur" value={f.value} onChange={(e) => {
                  const next = [...s.fields]; next[i] = { ...f, value: e.target.value }; set("fields", next);
                }} />
                <label className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
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
        <span className="text-xs text-neutral-400">Aperçu</span>
        <EmbedPreview s={s} />

        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div>
            <span className="mb-1 block text-xs text-neutral-400">Envoyer dans</span>
            <select className={inputCls} value={channelId} onChange={(e) => setChannelId(e.target.value)}>
              <option value="">— Choisir un salon —</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => sendEmbedAction(guildId, channelId, embed))}
            className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {pending ? "…" : "Envoyer l'embed"}
          </button>

          <div className="flex gap-2">
            <input className={inputCls} placeholder="Nom du modèle" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveTemplateAction(guildId, templateName, embed))}
              className="whitespace-nowrap rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>

          {msg && (
            <span className={msg.ok ? "text-sm text-green-400" : "text-sm text-red-400"}>{msg.text}</span>
          )}
        </div>

        {/* Modèles enregistrés */}
        {templates.length > 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <span className="text-xs text-neutral-400">Modèles enregistrés</span>
            <ul className="mt-2 flex flex-col gap-1">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <button type="button" className="text-left hover:text-brand" onClick={() => setS(fromEmbedData(t.data))}>
                    {t.name}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteTemplateAction(guildId, t.id))}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    Supprimer
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
  return (
    <div className="rounded-lg bg-[#313338] p-4">
      <div
        className="flex gap-3 rounded border-l-4 bg-[#2b2d31] p-3"
        style={{ borderColor: s.colorHex }}
      >
        <div className="min-w-0 flex-1">
          {s.authorName && <p className="text-sm font-semibold text-white">{s.authorName}</p>}
          {s.title && <p className="mt-0.5 font-semibold text-[#00a8fc]">{s.title}</p>}
          {s.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">{s.description}</p>
          )}
          {s.fields.filter((f) => f.name || f.value).length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {s.fields.filter((f) => f.name || f.value).map((f, i) => (
                <div key={i} className={f.inline ? "" : "col-span-2"}>
                  <p className="text-xs font-semibold text-white">{f.name}</p>
                  <p className="text-xs text-[#dbdee1]">{f.value}</p>
                </div>
              ))}
            </div>
          )}
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="mt-3 max-h-48 rounded" />
          )}
          {s.footerText && <p className="mt-2 text-xs text-[#949ba4]">{s.footerText}</p>}
        </div>
        {s.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.thumbnail} alt="" className="size-16 rounded object-cover" />
        )}
      </div>
    </div>
  );
}
