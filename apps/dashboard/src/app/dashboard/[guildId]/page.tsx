import Link from "next/link";
import { assertGuildAccess } from "@/lib/guard";
import { getGuildMeta } from "@/lib/bot";
import { loadWelcomeConfig } from "@/lib/config/welcome";
import { loadModerationConfig } from "@/lib/config/moderation";
import { loadTicketsConfig } from "@/lib/config/tickets";
import { loadVerificationConfig } from "@/lib/config/verification";
import { listTemplates } from "@/lib/config/embeds";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconHome,
  IconUsers,
  IconHash,
  IconTag,
  IconMessage,
  IconWave,
  IconShield,
  IconSettings,
  IconTicket,
  IconVerified,
} from "@/components/ui/Icons";

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="grid size-11 place-items-center rounded-xl bg-brand/15 text-brand">{icon}</div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function FeatureRow({
  href,
  icon,
  title,
  desc,
  enabled,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  enabled: boolean;
}) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-4 p-4 transition hover:border-brand/50 hover:bg-white/[0.03]"
    >
      <div className="grid size-10 place-items-center rounded-xl bg-white/5 text-neutral-300">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="truncate text-sm text-neutral-500">{desc}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          enabled
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-neutral-500/15 text-neutral-400"
        }`}
      >
        {enabled ? "Activé" : "Inactif"}
      </span>
    </Link>
  );
}

export default async function GuildHomePage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);

  const [meta, welcome, moderation, tickets, verification, templates] = await Promise.all([
    getGuildMeta(guildId),
    loadWelcomeConfig(guildId),
    loadModerationConfig(guildId),
    loadTicketsConfig(guildId),
    loadVerificationConfig(guildId),
    listTemplates(guildId),
  ]);

  const base = `/dashboard/${guildId}`;
  const online = meta !== null;

  return (
    <>
      <PageHeader
        title={guild.name}
        description="Vue d'ensemble de ta configuration Drivebot."
        icon={<IconHome />}
        action={
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
              online ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}
          >
            <span className={`size-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
            {online ? "Bot en ligne" : "Bot hors ligne"}
          </span>
        }
      />

      {!online && (
        <p className="mb-6 rounded-xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-300">
          Drivebot ne répond pas. Certaines infos (salons, rôles, membres) ne
          seront pas à jour tant qu'il n'est pas démarré.
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<IconUsers />} value={meta?.memberCount ?? "—"} label="Membres" />
        <Stat icon={<IconHash />} value={meta?.channels.length ?? "—"} label="Salons" />
        <Stat icon={<IconTag />} value={meta?.roles.length ?? "—"} label="Rôles" />
        <Stat icon={<IconMessage />} value={templates.length} label="Modèles d'embed" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Configuration
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <FeatureRow
          href={`${base}/welcome`}
          icon={<IconWave />}
          title="Bienvenue & autorole"
          desc={welcome.joinEnabled ? "Message d'arrivée actif" : "Aucun message d'arrivée"}
          enabled={welcome.joinEnabled || welcome.leaveEnabled || welcome.autoRoleIds.length > 0}
        />
        <FeatureRow
          href={`${base}/verification`}
          icon={<IconVerified />}
          title="Vérification"
          desc={verification.enabled ? "Captcha anti-bot actif" : "Désactivée"}
          enabled={verification.enabled}
        />
        <FeatureRow
          href={`${base}/tickets`}
          icon={<IconTicket />}
          title="Tickets"
          desc={tickets.enabled ? "Support par tickets actif" : "Système désactivé"}
          enabled={tickets.enabled}
        />
        <FeatureRow
          href={`${base}/moderation`}
          icon={<IconShield />}
          title="Modération & logs"
          desc={moderation.logEnabled ? "Journalisation active" : "Logs désactivés"}
          enabled={moderation.logEnabled}
        />
        <FeatureRow
          href={`${base}/embeds`}
          icon={<IconMessage />}
          title="Embed builder"
          desc={`${templates.length} modèle(s) enregistré(s)`}
          enabled={templates.length > 0}
        />
        <FeatureRow
          href={`${base}/settings`}
          icon={<IconSettings />}
          title="Paramètres"
          desc="Langue et préfixe du bot"
          enabled
        />
      </div>
    </>
  );
}
