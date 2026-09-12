"use client";
import { useState, useTransition } from "react";
import { saveSuggestionsAction } from "@/app/dashboard/[guildId]/suggestions/actions";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "./SettingsForm";

export function SuggestionsForm({ guildId, forums, initial }: { guildId: string; forums: { id: string; name: string }[]; initial: { enabled: boolean; channelId: string } }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [channelId, setChannelId] = useState(initial.channelId);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  return <div className="flex flex-col gap-6"><SectionCard title="Votes automatiques" description="Drivebot doit pouvoir voir le forum, lire les messages et ajouter des réactions." aside={<Toggle checked={enabled} onChange={setEnabled} />}>
    <Field label="Forum de suggestions"><select className="field-input" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
      <option value="">— Choisir un forum —</option>
      {channelId && !forums.some((c) => c.id === channelId) && <option value={channelId}>Forum actuel ({channelId}) — indisponible</option>}
      {forums.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select></Field>
    {!forums.length && <p className="mt-3 text-sm text-muted">Aucun forum disponible. Vérifie les salons et la connexion de Drivebot.</p>}
  </SectionCard><SaveBar pending={pending} msg={msg} onSave={() => startTransition(async () => {
    try { setMsg(await saveSuggestionsAction(guildId, { enabled, channelId })); }
    catch { setMsg({ ok: false, message: "Enregistrement impossible. Réessaie après avoir vérifié la connexion." }); }
  })} /></div>;
}
