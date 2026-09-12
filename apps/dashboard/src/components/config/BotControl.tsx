"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GuildBot } from "@/lib/bot";
import { reloadBotAction } from "@/app/dashboard/[guildId]/bots/actions";
import { SectionCard } from "@/components/ui/Card";
import { ManagedBotCard } from "./ManagedBotCard";

export function BotControl({ guildId, bots, online, channels }: { guildId: string; bots: GuildBot[] | null; online: boolean; channels: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 30_000);
    return () => clearInterval(timer);
  }, [router]);
  return <div className="flex flex-col gap-6">
    <SectionCard title="Drivebot" description="Recharge la configuration enregistrée et accède aux modules du bot."
      aside={<span className={`pill ${online ? "pill-ok" : "pill-danger"}`}>{online ? "Connecté à Discord" : "Indisponible"}</span>}>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={pending || !online} onClick={() => startTransition(async () => {
          try { const result = await reloadBotAction(guildId); setMessage(result.error ?? (result.ok ? "Configuration rechargée." : "Échec du rechargement.")); }
          catch { setMessage("Rechargement impossible. Réessaie après avoir vérifié la connexion."); }
        })}>Recharger la configuration</button>
        <button className="btn-ghost" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Chargement…" : "Actualiser"}</button>
      </div>
      <p role="status" className="mt-3 text-sm text-muted">{message}</p>
      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        {[ ["welcome", "Bienvenue"], ["verification", "Vérification"], ["reaction-roles", "Rôles"], ["embeds", "Messages & embeds"], ["moderation", "Modération"], ["tickets", "Tickets"], ["status", "État du bot"] ].map(([path, label]) =>
          <Link className="underline" key={path} href={`/dashboard/${guildId}/${path}`}>{label}</Link>)}
      </div>
    </SectionCard>
    <SectionCard title="Bots présents sur le serveur" description={`${bots?.filter((b) => b.controlled).length ?? 0} bot(s) pilotables. Les réglages de présence sont conservés après un redémarrage.`}>
      {bots === null ? <p role="alert" className="text-sm text-muted">Inventaire indisponible. Vérifie la connexion du bot et son intent Server Members, puis actualise.</p>
        : bots.length === 0 ? <p>Aucun bot trouvé.</p> : <div className="flex flex-col gap-4">
          {bots.map((bot) => <ManagedBotCard key={bot.id} bot={bot} guildId={guildId} channels={channels} />)}
        </div>}
    </SectionCard>
  </div>;
}
