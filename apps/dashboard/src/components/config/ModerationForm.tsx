"use client";

import { useState, useTransition } from "react";
import type { GuildMeta } from "@drivebot/types";
import { saveModerationAction } from "@/app/dashboard/[guildId]/moderation/actions";
import type { SaveState } from "@/app/dashboard/[guildId]/welcome/actions";
import type { ModerationFormData } from "@/lib/config/moderation";
import { SectionCard, Field } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SaveBar } from "@/components/config/SettingsForm";
import { IconShield } from "@/components/ui/Icons";

export function ModerationForm({
  guildId,
  meta,
  initial,
}: {
  guildId: string;
  meta: GuildMeta | null;
  initial: ModerationFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<SaveState | null>(null);
  const [logEnabled, setLogEnabled] = useState(initial.logEnabled);
  const [logChannel, setLogChannel] = useState(initial.logChannel ?? "");

  const channels = meta?.channels ?? [];
  const channelOptions =
    logChannel && !channels.some((c) => c.id === logChannel)
      ? [{ id: logChannel, name: "salon actuel" }, ...channels]
      : channels;

  const save = () =>
    startTransition(async () => {
      setMsg(await saveModerationAction(guildId, { logEnabled, logChannel: logChannel || null }));
    });

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Journalisation"
        description="Enregistre les sanctions et les poste dans un salon."
        icon={<IconShield />}
        aside={<Toggle checked={logEnabled} onChange={setLogEnabled} />}
      >
        <Field label="Salon de logs">
          <select value={logChannel} onChange={(e) => setLogChannel(e.target.value)} className="field-input">
            <option value="">— Choisir un salon —</option>
            {channelOptions.map((c) => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </Field>
        <div className="mt-4 flex flex-wrap gap-2">
          {["/kick", "/ban", "/timeout", "/warn"].map((c) => (
            <code key={c} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-neutral-400">{c}</code>
          ))}
        </div>
      </SectionCard>

      <SaveBar pending={pending} msg={msg} onSave={save} />
    </div>
  );
}
