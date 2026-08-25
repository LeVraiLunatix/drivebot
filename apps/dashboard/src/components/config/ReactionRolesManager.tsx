"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import {
  createPanelAction,
  savePanelAction,
  deletePanelAction,
  publishPanelAction,
} from "@/app/dashboard/[guildId]/reaction-roles/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type {
  ReactionRolePanelFormData,
  ReactionRoleOptionData,
} from "@/lib/config/reactionRoles";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { IconTag, IconSend, IconTrash, IconPlus, IconCheck } from "@/components/ui/Icons";

const hexToInt = (h: string) => parseInt(h.replace("#", ""), 16) || 0x5865f2;
const intToHex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

export function ReactionRolesManager({
  guildId,
  meta,
  initialPanels,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initialPanels: ReactionRolePanelFormData[];
}) {
  const [panels, setPanels] = useState(initialPanels);
  const [creating, startCreating] = useTransition();

  const addPanel = () =>
    startCreating(async () => {
      const panel = await createPanelAction(guildId);
      setPanels((p) => [...p, panel]);
    });

  const removePanel = (id: string) => setPanels((p) => p.filter((panel) => panel.id !== id));

  return (
    <div className="flex flex-col gap-6">
      {!meta && (
        <p className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-300">
          Bot injoignable : listes de salons/rôles vides.
        </p>
      )}

      {panels.length === 0 && (
        <p className="text-sm text-neutral-500">Aucun panneau pour l&apos;instant.</p>
      )}

      {panels.map((panel) => (
        <PanelCard
          key={panel.id}
          guildId={guildId}
          meta={meta}
          initial={panel}
          onDeleted={() => removePanel(panel.id)}
        />
      ))}

      <button type="button" onClick={addPanel} disabled={creating} className="btn-ghost justify-center">
        <IconPlus width={18} height={18} /> Nouveau panneau
      </button>
    </div>
  );
}

function PanelCard({
  guildId,
  meta,
  initial,
  onDeleted,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: ReactionRolePanelFormData;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [s, setS] = useState(initial);
  const [colorHex, setColorHex] = useState(intToHex(initial.color));
  const [published, setPublished] = useState(!!initial.messageId);

  const set = <K extends keyof ReactionRolePanelFormData>(k: K, v: ReactionRolePanelFormData[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const channels = meta?.channels ?? [];
  const roles = meta?.roles ?? [];

  const opt = (list: { id: string; name: string }[], selected: string | null) =>
    selected && !list.some((c) => c.id === selected)
      ? [{ id: selected, name: "actuel" }, ...list]
      : list;

  const setRole = (i: number, patch: Partial<ReactionRoleOptionData>) =>
    setS((p) => ({ ...p, roles: p.roles.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));

  const addRole = () =>
    setS((p) => ({ ...p, roles: [...p.roles, { roleId: "", label: "", emoji: "" }] }));
  const removeRole = (i: number) =>
    setS((p) => ({ ...p, roles: p.roles.filter((_, idx) => idx !== i) }));

  const payload = (): ReactionRolePanelFormData => ({ ...s, color: hexToInt(colorHex) });

  const save = () =>
    startTransition(async () => setMsg(await savePanelAction(guildId, s.id, payload())));
  const publish = () =>
    startTransition(async () => {
      const res = await publishPanelAction(guildId, s.id);
      setMsg(res);
      if (res.ok) setPublished(true);
    });
  const remove = () =>
    startTransition(async () => {
      await deletePanelAction(guildId, s.id);
      onDeleted();
    });

  return (
    <SectionCard
      title={s.title || "Panneau"}
      description={published ? "Publié — republie pour appliquer tes changements." : "Pas encore publié."}
      icon={<IconTag />}
      aside={
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-lg p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
          aria-label="Supprimer le panneau"
        >
          <IconTrash width={18} height={18} />
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Salon">
            <select className="field-input" value={s.channelId ?? ""} onChange={(e) => set("channelId", e.target.value || null)}>
              <option value="">— Choisir —</option>
              {opt(channels, s.channelId).map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Titre">
            <input className="field-input" value={s.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea className="field-input" rows={2} value={s.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="flex items-center gap-4">
            <Field label="Couleur">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-[var(--color-line)] bg-transparent"
              />
            </Field>
            <div className="flex-1 pt-5">
              <Toggle
                checked={!s.multiple}
                onChange={(v) => set("multiple", !v)}
                label="Un seul rôle à la fois"
                hint="Choisir un nouveau rôle retire les autres du panneau."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Rôles ({s.roles.length}/25)
          </span>
          <div className="flex flex-col gap-2">
            {s.roles.map((r, i) => {
              const used = s.roles
                .map((x, idx) => (idx === i ? null : x.roleId))
                .filter((id): id is string => !!id);
              const available = roles.filter((role) => !used.includes(role.id));
              const list =
                r.roleId && !available.some((a) => a.id === r.roleId)
                  ? [roles.find((rl) => rl.id === r.roleId) ?? { id: r.roleId, name: "actuel", color: 0 }, ...available]
                  : available;
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="field-input flex-1"
                    value={r.roleId}
                    onChange={(e) => {
                      const role = roles.find((rl) => rl.id === e.target.value);
                      setRole(i, { roleId: e.target.value, label: r.label || role?.name || "" });
                    }}
                  >
                    <option value="">— Rôle —</option>
                    {list.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <input
                    className="field-input w-28"
                    placeholder="Libellé"
                    value={r.label}
                    onChange={(e) => setRole(i, { label: e.target.value })}
                  />
                  <input
                    className="field-input w-14 text-center"
                    placeholder="🎮"
                    value={r.emoji}
                    onChange={(e) => setRole(i, { emoji: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeRole(i)}
                    className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Retirer ce rôle"
                  >
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addRole}
            disabled={s.roles.length >= 25}
            className="btn-ghost justify-center"
          >
            <IconPlus width={16} height={16} /> Ajouter un rôle
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : (<><IconCheck width={18} height={18} /> Enregistrer</>)}
        </button>
        <button type="button" onClick={publish} disabled={pending} className="btn-ghost">
          <IconSend width={18} height={18} /> {published ? "Republier" : "Publier"}
        </button>
        {msg?.message && (
          <span className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.message}</span>
        )}
      </div>
    </SectionCard>
  );
}
