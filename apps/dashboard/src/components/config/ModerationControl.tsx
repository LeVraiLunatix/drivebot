"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateAction } from "@/app/dashboard/[guildId]/bots/actions";
import { SectionCard, Field } from "@/components/ui/Card";

const labels: Record<string, string> = { WARN: "Avertir", TIMEOUT: "Exclure temporairement", KICK: "Expulser", BAN: "Bannir", UNBAN: "Débannir" };

export function ModerationControl({ guildId }: { guildId: string }) {
  const router = useRouter();
  const [action, setAction] = useState("WARN");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <SectionCard title="Agir sur un membre" description="Les actions sont exécutées sur Discord et enregistrées au nom du propriétaire du dashboard.">
    <form className="flex flex-col gap-4" onSubmit={(event) => {
      event.preventDefault();
      if (!window.confirm(`${labels[action]} le membre ${targetId} ?\nRaison : ${reason}`)) return;
      startTransition(async () => {
        setMessage("");
        try {
          const result = await moderateAction(guildId, { action, targetId, reason, minutes });
          setMessage(result.error ?? (result.ok ? "Action effectuée et enregistrée." : "Action refusée."));
          router.refresh();
        } catch { setMessage("Réponse indisponible. Vérifie Discord et l'historique avant de réessayer."); }
      });
    }}>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <Field label="Action"><select className="field-input" value={action} onChange={(e) => setAction(e.target.value)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Identifiant Discord du membre" hint="Discord → Mode développeur → Copier l'identifiant utilisateur."><input required pattern="[0-9]{17,20}" className="field-input" value={targetId} onChange={(e) => setTargetId(e.target.value.trim())} /></Field>
        {action === "TIMEOUT" && <Field label="Durée (minutes)"><input required type="number" min={1} max={40320} className="field-input" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></Field>}
        <Field label="Raison"><input required maxLength={400} className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </fieldset>
      <button className="btn-primary self-start" disabled={pending || !reason.trim()} type="submit">{pending ? "Exécution…" : labels[action]}</button>
      <p role="status" className="text-sm text-muted">{message}</p>
    </form>
  </SectionCard>;
}
