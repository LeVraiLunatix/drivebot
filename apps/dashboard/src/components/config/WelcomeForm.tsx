"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import { saveWelcome, type SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { WelcomeFormData } from "@/lib/config/welcome";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconWave, IconLogout, IconTag, IconShield } from "@/components/ui/Icons";
import { BotPicker, useBotSelection } from "@/components/BotSelection";

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
  const [joinAfterVerification, setJoinAfterVerification] = useState(initial.joinAfterVerification);
  const [leaveEnabled, setLeaveEnabled] = useState(initial.leaveEnabled);
  const [leaveChannel, setLeaveChannel] = useState(initial.leaveChannel ?? "");
  const [leaveMessage, setLeaveMessage] = useState(initial.leaveMessage);
  const [autoRoleIds, setAutoRoleIds] = useState<string[]>(initial.autoRoleIds);
  const { selectedBotId } = useBotSelection();

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
          botId: selectedBotId || null,
          joinEnabled,
          joinChannel: joinChannel || null,
          joinMessage,
          joinAfterVerification,
          leaveEnabled,
          leaveChannel: leaveChannel || null,
          leaveMessage,
          autoRoleIds,
        }),
      );
    });

  return (
    <div className="flex flex-col gap-6">
      <BotPicker assignedBotId={initial.botId} label="Bot qui envoie les messages d’arrivée et de départ" />
      {!meta && (
        <p className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-300">
          Bot injoignable : les listes de salons et rôles sont vides.
        </p>
      )}

      <SectionCard
        title="Message de bienvenue"
        description={joinAfterVerification ? "Envoyé dès que le membre termine la vérification." : "Envoyé dès que le membre rejoint le serveur."}
        icon={<IconWave />}
        aside={<Toggle checked={joinEnabled} onChange={setJoinEnabled} label="" />}
      >
        <div className="grid gap-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-line)] bg-wash px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Attendre la vérification</p>
              <p className="mt-0.5 text-xs text-muted">Le membre reçoit sa bienvenue uniquement après avoir obtenu son accès.</p>
            </div>
            <Toggle checked={joinAfterVerification} onChange={setJoinAfterVerification} label="" />
          </div>
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
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Aperçu de l'embed</span>
            <WelcomeEmbedPreview kind="join" message={joinMessage} serverName={meta?.name} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Parcours synchronisé"
        description="Résumé des actions réellement exécutées par les bots avec ces réglages."
        icon={<IconShield />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <FlowStep number="1" title="Arrivée" text="Rôle non vérifié et rôles automatiques attribués." />
          <FlowStep number="2" title="Vérification" text={joinAfterVerification ? "Accès débloqué, puis embed de bienvenue envoyé." : "Accès au serveur débloqué."} />
          <FlowStep number="3" title="Départ" text="Embed de départ envoyé dans le salon choisi." />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <SyncChip label={joinEnabled ? `Bienvenue · #${channels.find((c) => c.id === joinChannel)?.name ?? "salon configuré"}` : "Bienvenue désactivée"} active={joinEnabled} />
          <SyncChip label={leaveEnabled ? `Départ · #${channels.find((c) => c.id === leaveChannel)?.name ?? "salon configuré"}` : "Départ désactivé"} active={leaveEnabled} />
          <SyncChip label={`${autoRoleIds.length} rôle${autoRoleIds.length > 1 ? "s" : ""} automatique${autoRoleIds.length > 1 ? "s" : ""}`} active={autoRoleIds.length > 0} />
          <SyncChip label="Embeds Discord" active />
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
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Aperçu de l'embed</span>
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
          {roles.length === 0 && <span className="text-sm text-muted">Aucun rôle disponible.</span>}
          {roles.map((r) => {
            const checked = autoRoleIds.includes(r.id);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => toggleRole(r.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  checked
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-[var(--color-line)] text-muted-2 hover:bg-wash"
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

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-wash p-4">
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">{number}</span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
    </div>
  );
}

function SyncChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`rounded-full border px-3 py-1.5 ${active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-[var(--color-line)] bg-wash"}`}>
      {active ? "●" : "○"} {label}
    </span>
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
