"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import { saveWelcome, type SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { WelcomeFormData } from "@/lib/config/welcome";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconWave, IconLogout, IconTag } from "@/components/ui/Icons";

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
    setAutoRoleIds((p) => (p.includes(id) ? p.filter((r) => r !== id) : [...p, id]));

  const channelOptions = (selected: string) =>
    selected && !channels.some((c) => c.id === selected)
      ? [{ id: selected, name: "salon actuel" }, ...channels]
      : channels;

  const save = () =>
    startTransition(async () => {
      setMsg(
        await saveWelcome(guildId, {
          joinEnabled,
          joinChannel: joinChannel || null,
          joinMessage,
          leaveEnabled,
          leaveChannel: leaveChannel || null,
          leaveMessage,
          autoRoleIds,
        }),
      );
    });

  return (
    <div className="flex flex-col gap-6">
      {!meta && (
        <p className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-300">
          Bot injoignable : les listes de salons et rôles sont vides.
        </p>
      )}

      <SectionCard
        title="Message de bienvenue"
        description="Envoyé quand un membre rejoint le serveur."
        icon={<IconWave />}
        aside={<Toggle checked={joinEnabled} onChange={setJoinEnabled} label="" />}
      >
        <div className="grid gap-5">
          <Field label="Salon">
            <select value={joinChannel} onChange={(e) => setJoinChannel(e.target.value)} className="field-input">
              <option value="">— Choisir un salon —</option>
              {channelOptions(joinChannel).map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Message"
            hint="Variables : {user} · {username} · {server} · {memberCount}"
          >
            <textarea value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} rows={3} className="field-input" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Message de départ"
        description="Envoyé quand un membre quitte le serveur."
        icon={<IconLogout />}
        aside={<Toggle checked={leaveEnabled} onChange={setLeaveEnabled} label="" />}
      >
        <div className="grid gap-5">
          <Field label="Salon">
            <select value={leaveChannel} onChange={(e) => setLeaveChannel(e.target.value)} className="field-input">
              <option value="">— Choisir un salon —</option>
              {channelOptions(leaveChannel).map((c) => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Message">
            <textarea value={leaveMessage} onChange={(e) => setLeaveMessage(e.target.value)} rows={2} className="field-input" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Rôles automatiques"
        description="Attribués à chaque nouveau membre."
        icon={<IconTag />}
      >
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 && <span className="text-sm text-neutral-500">Aucun rôle disponible.</span>}
          {roles.map((r) => {
            const checked = autoRoleIds.includes(r.id);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => toggleRole(r.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  checked
                    ? "border-brand bg-brand/15 text-white"
                    : "border-[var(--color-line)] text-neutral-300 hover:bg-white/5"
                }`}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99aab5" }}
                />
                {r.name}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}
