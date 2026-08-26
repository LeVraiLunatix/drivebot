"use client";

import { useState, useTransition } from "react";
import { saveProtectionAction } from "@/app/dashboard/[guildId]/moderation/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { ProtectionFormData } from "@/lib/config/protection";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconBolt } from "@/components/ui/Icons";

export function ProtectionForm({
  guildId,
  initial,
}: {
  guildId: string;
  initial: ProtectionFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [s, setS] = useState(initial);

  const set = <K extends keyof ProtectionFormData>(k: K, v: ProtectionFormData[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const save = () =>
    startTransition(async () => setMsg(await saveProtectionAction(guildId, s)));

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Anti-spam"
        description="Sanctionne un membre qui envoie trop de messages d'affilée."
        icon={<IconBolt />}
        aside={<Toggle checked={s.antiSpamEnabled} onChange={(v) => set("antiSpamEnabled", v)} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seuil de messages">
            <input
              type="number"
              min={2}
              max={30}
              className="field-input"
              value={s.spamMessageThreshold}
              onChange={(e) => set("spamMessageThreshold", Number(e.target.value))}
            />
          </Field>
          <Field label="Sur une fenêtre de (secondes)">
            <input
              type="number"
              min={2}
              max={60}
              className="field-input"
              value={s.spamIntervalSeconds}
              onChange={(e) => set("spamIntervalSeconds", Number(e.target.value))}
            />
          </Field>
          <Field label="Sanction">
            <select
              className="field-input"
              value={s.spamAction}
              onChange={(e) => set("spamAction", e.target.value as ProtectionFormData["spamAction"])}
            >
              <option value="TIMEOUT">Exclusion temporaire</option>
              <option value="KICK">Expulsion</option>
            </select>
          </Field>
          {s.spamAction === "TIMEOUT" && (
            <Field label="Durée du timeout (minutes)">
              <input
                type="number"
                min={1}
                max={1440}
                className="field-input"
                value={s.spamTimeoutMinutes}
                onChange={(e) => set("spamTimeoutMinutes", Number(e.target.value))}
              />
            </Field>
          )}
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Les messages en excès sont supprimés et le membre est sanctionné. Les membres avec la
          permission <b>Gérer les messages</b> ne sont jamais concernés.
        </p>
      </SectionCard>

      <SectionCard
        title="Anti-raid"
        description="Expulse automatiquement une vague d'arrivées suspecte."
        icon={<IconBolt />}
        aside={<Toggle checked={s.antiRaidEnabled} onChange={(v) => set("antiRaidEnabled", v)} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seuil d'arrivées">
            <input
              type="number"
              min={2}
              max={50}
              className="field-input"
              value={s.raidJoinThreshold}
              onChange={(e) => set("raidJoinThreshold", Number(e.target.value))}
            />
          </Field>
          <Field label="Sur une fenêtre de (secondes)">
            <input
              type="number"
              min={2}
              max={300}
              className="field-input"
              value={s.raidIntervalSeconds}
              onChange={(e) => set("raidIntervalSeconds", Number(e.target.value))}
            />
          </Field>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Tous les membres arrivés pendant la rafale sont expulsés dès que le seuil est franchi.
        </p>
      </SectionCard>

      <p className="text-xs text-neutral-600">
        Les sanctions automatiques utilisent le même historique et le même salon de logs que la
        modération manuelle, configurés ci-dessus.
      </p>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}
