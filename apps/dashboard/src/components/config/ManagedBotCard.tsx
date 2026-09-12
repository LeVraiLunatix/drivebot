"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { GuildBot } from "@/lib/bot";
import { managedBotAction } from "@/app/dashboard/[guildId]/bots/actions";
import { Field } from "@/components/ui/Card";

export function ManagedBotCard({ bot, guildId, channels }: { bot: GuildBot; guildId: string; channels: { id: string; name: string }[] }) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(bot.preferences ?? { enabled: true, status: "online", activity: "", activityType: 0 });
  const [nickname, setNickname] = useState(bot.name);
  const [username, setUsername] = useState(bot.username);
  const [channelId, setChannelId] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; error?: string; messageUrl?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  function run(data: unknown, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    startTransition(async () => {
      setFeedback(null);
      try {
        const result = await managedBotAction(guildId, bot.id, data);
        setFeedback(result);
        if (result.ok && (data as { action: string }).action === "message") setContent("");
        router.refresh();
      } catch { setFeedback({ ok: false, error: "Réponse indisponible. Vérifie Discord avant de réessayer." }); }
    });
  }
  return <article className="card overflow-hidden">
    <div className="flex flex-wrap items-center gap-4 p-5">
      {bot.avatarUrl && <Image src={bot.avatarUrl} width={48} height={48} alt="" className="rounded-xl" />}
      <div className="min-w-0 flex-1"><h2 className="font-semibold">{bot.name}</h2><p className="font-mono text-xs text-muted">{bot.id}</p></div>
      <span className={`pill ${bot.online ? "pill-ok" : "pill-off"}`}>{!bot.controlled ? "Non connecté au dashboard" : bot.online ? "Connecté" : "Déconnecté"}</span>
    </div>
    {bot.controlled && <details className="border-t border-[var(--line)] p-5">
      <summary className="cursor-pointer text-sm font-medium">Contrôler {bot.name}</summary>
      <fieldset disabled={pending} className="mt-5 flex flex-col gap-6">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run({ action: "preferences", preferences }); }}>
          <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={preferences.enabled} disabled={bot.primary} onChange={(e) => setPreferences({ ...preferences, enabled: e.target.checked })} />Connecter le bot à Discord</label>
          {bot.primary && <p className="text-xs text-muted sm:col-span-2">Le bot principal reste connecté pour assurer les modules et le centre de contrôle.</p>}
          <Field label="Présence"><select className="field-input" value={preferences.status} onChange={(e) => setPreferences({ ...preferences, status: e.target.value as typeof preferences.status })}>
            <option value="online">En ligne</option><option value="idle">Absent</option><option value="dnd">Ne pas déranger</option><option value="invisible">Invisible</option>
          </select></Field>
          <Field label="Type d’activité"><select className="field-input" value={preferences.activityType} onChange={(e) => setPreferences({ ...preferences, activityType: Number(e.target.value) })}>
            <option value={0}>Joue à</option><option value={2}>Écoute</option><option value={3}>Regarde</option><option value={5}>Participe à</option>
          </select></Field>
          <Field label="Activité" hint="Vide pour masquer l’activité."><input className="field-input" value={preferences.activity} maxLength={128} onChange={(e) => setPreferences({ ...preferences, activity: e.target.value })} /></Field>
          <div className="flex items-end"><button type="submit" className="btn-primary">Enregistrer la présence</button></div>
        </form>
        <div className="grid gap-5 sm:grid-cols-2">
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run({ action: "nickname", nickname }); }}>
            <Field label="Surnom sur ce serveur" hint="Vide pour reprendre le nom du bot."><input className="field-input" maxLength={32} value={nickname} onChange={(e) => setNickname(e.target.value)} /></Field>
            <button type="submit" className="btn-ghost self-start">Modifier le surnom</button>
          </form>
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run({ action: "username", username }, `Renommer ${bot.name} en ${username} sur tous ses serveurs ?`); }}>
            <Field label="Nom global" hint="Discord limite la fréquence des changements de nom."><input className="field-input" required minLength={2} maxLength={32} value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
            <button type="submit" className="btn-ghost self-start">Modifier le nom global</button>
          </form>
        </div>
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); run({ action: "message", channelId, content }, `Publier ce message avec ${bot.name} dans #${channels.find((c) => c.id === channelId)?.name} ?\n\n${content}`); }}>
          <Field label="Publier un message avec ce bot"><select className="field-input" required value={channelId} onChange={(e) => setChannelId(e.target.value)}>
            <option value="">— Choisir un salon —</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select></Field>
          <Field label="Message" hint="Les mentions n’envoient pas de notification."><textarea className="field-input" required maxLength={2000} rows={4} value={content} onChange={(e) => setContent(e.target.value)} /></Field>
          <button type="submit" className="btn-primary self-start">Publier le message</button>
        </form>
      </fieldset>
      {pending && <p role="status" className="mt-4 text-sm text-muted">Commande en cours…</p>}
      {feedback && <p role="status" className={`mt-4 text-sm ${feedback.ok ? "text-emerald-500" : "text-red-500"}`}>{feedback.error ?? "Commande effectuée."} {feedback.messageUrl && <a href={feedback.messageUrl} target="_blank" rel="noreferrer" className="underline">Voir le message</a>}</p>}
    </details>}
    {bot.error && <p role="alert" className="px-5 pb-5 text-sm text-red-500">{bot.error}</p>}
  </article>;
}
