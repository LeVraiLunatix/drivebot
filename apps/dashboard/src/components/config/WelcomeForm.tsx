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
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">Aperçu de l'embed</span>
            <WelcomeEmbedPreview kind="join" message={joinMessage} serverName={meta?.name} />
          </div>
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
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">Aperçu de l'embed</span>
            <WelcomeEmbedPreview kind="leave" message={leaveMessage} serverName={meta?.name} />
          </div>
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

/** Aperçu fidèle de l'embed que le bot envoie à l'arrivée / au départ. */
function WelcomeEmbedPreview({
  kind,
  message,
  serverName,
}: {
  kind: "join" | "leave";
  message: string;
  serverName?: string;
}) {
  const server = serverName ?? "le serveur";
  const rendered = message
    .replaceAll("{user}", "@NouveauMembre")
    .replaceAll("{username}", "NouveauMembre")
    .replaceAll("{server}", server)
    .replaceAll("{memberCount}", "42");

  const isJoin = kind === "join";
  const color = isJoin ? "#57f287" : "#ed4245";
  const title = isJoin ? "🎉 Un nouveau membre nous rejoint !" : "👋 Un membre nous a quittés";

  return (
    <div className="rounded-2xl bg-[#313338] p-3">
      <div className="flex gap-3 rounded-lg border-l-4 bg-[#2b2d31] p-3" style={{ borderColor: color }}>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#dbdee1]">{server}</p>
          <p className="mt-0.5 font-semibold text-white">{title}</p>
          {rendered && <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">{rendered}</p>}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs font-semibold text-white">👤 Membre</p>
              <p className="text-xs text-[#00a8fc]">@NouveauMembre</p>
            </div>
            {isJoin ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-white">🔢 Position</p>
                  <p className="text-xs text-[#dbdee1]">42ᵉ membre</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">📅 Compte créé</p>
                  <p className="text-xs text-[#dbdee1]">il y a 2 ans</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs font-semibold text-white">👥 Membres restants</p>
                <p className="text-xs text-[#dbdee1]">41</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-[#949ba4]">ID : 123456789 • aujourd'hui</p>
        </div>
        <div className="size-14 shrink-0 rounded-full bg-[#5865f2]/40" />
      </div>
    </div>
  );
}
