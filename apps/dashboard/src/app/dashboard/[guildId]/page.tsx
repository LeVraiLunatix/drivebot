import { assertGuildAccess } from "@/lib/guard";
import { getCommunityOverview, getGuildMeta } from "@/lib/bot";
import { loadWelcomeConfig } from "@/lib/config/welcome";
import { loadModerationConfig } from "@/lib/config/moderation";
import { loadTicketsConfig } from "@/lib/config/tickets";
import { loadVerificationConfig } from "@/lib/config/verification";
import { loadStatusConfig } from "@/lib/config/status";
import { listTemplates } from "@/lib/config/embeds";
import { PageHeader } from "@/components/ui/PageHeader";
import { GroupLabel } from "@/components/ui/Card";
import { Stats, FeatureList, type Feature } from "@/components/dashboard/Overview";
import {
  IconUsers,
  IconHash,
  IconTag,
  IconMessage,
  IconWave,
  IconShield,
  IconSettings,
  IconTicket,
  IconVerified,
  IconActivity,
} from "@/components/ui/Icons";

export default async function GuildHomePage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const guild = await assertGuildAccess(guildId);

  const [meta, welcome, moderation, tickets, verification, templates, statusCfg, community] = await Promise.all([
    getGuildMeta(guildId),
    loadWelcomeConfig(guildId),
    loadModerationConfig(guildId),
    loadTicketsConfig(guildId),
    loadVerificationConfig(guildId),
    listTemplates(guildId),
    loadStatusConfig(guildId),
    getCommunityOverview(guildId),
  ]);

  const base = `/dashboard/${guildId}`;
  const online = meta !== null;

  const features: Feature[] = [
    {
      href: `${base}/server`,
      icon: <IconHash />,
      title: "Serveur & publications",
      desc: community ? `${community.publications.filter((item) => item.published).length}/${community.publications.length} messages officiels synchronisés` : "Synchronisation indisponible",
      enabled: community?.onboarding.ready === true,
    },
    {
      href: `${base}/welcome`,
      icon: <IconWave />,
      title: "Bienvenue & autorole",
      desc: welcome.joinEnabled
        ? welcome.joinAfterVerification ? "Bienvenue envoyée après vérification" : "Message d'arrivée actif"
        : "Aucun message d'arrivée",
      enabled: welcome.joinEnabled || welcome.leaveEnabled || welcome.autoRoleIds.length > 0,
    },
    {
      href: `${base}/verification`,
      icon: <IconVerified />,
      title: "Vérification",
      desc: verification.enabled ? "Captcha anti-bot actif" : "Désactivée",
      enabled: verification.enabled,
    },
    {
      href: `${base}/tickets`,
      icon: <IconTicket />,
      title: "Tickets",
      desc: tickets.enabled ? "Support par tickets actif" : "Système désactivé",
      enabled: tickets.enabled,
    },
    {
      href: `${base}/moderation`,
      icon: <IconShield />,
      title: "Modération & logs",
      desc: moderation.logEnabled ? "Journalisation active" : "Logs désactivés",
      enabled: moderation.logEnabled,
    },
    {
      href: `${base}/embeds`,
      icon: <IconMessage />,
      title: "Embed builder",
      desc: `${templates.length} modèle(s) enregistré(s)`,
      enabled: templates.length > 0,
    },
    {
      href: `${base}/status`,
      icon: <IconActivity />,
      title: "État du système",
      desc: statusCfg.enabled ? "Rapport auto toutes les 30 min" : "Rapport automatique désactivé",
      enabled: statusCfg.enabled,
    },
    {
      href: `${base}/settings`,
      icon: <IconSettings />,
      title: "Paramètres",
      desc: "Langue et préférences générales",
      enabled: true,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Serveur Discord"
        title={guild.name}
        description="Tous tes bots et modules Discord au même endroit."
        action={
          <span className={`pill ${online ? "pill-ok" : "pill-danger"}`}>
            <span
              className="size-1.5 rounded-full"
              style={{ background: online ? "var(--ok-ink)" : "var(--danger)" }}
            />
            {online ? "Centre connecté" : "Centre hors ligne"}
          </span>
        }
      />

      {!online && (
        <p
          className="mb-8 rounded-[var(--radius-lg)] border p-4 text-sm leading-relaxed"
          style={{
            borderColor: "color-mix(in oklch, var(--warn-ink) 35%, transparent)",
            background: "color-mix(in oklch, var(--warn-ink) 10%, transparent)",
            color: "var(--warn-ink)",
          }}
        >
          Le centre de contrôle ne répond pas. Les salons, rôles et membres ne seront pas à
          jour tant que le service principal n&apos;est pas démarré.
        </p>
      )}

      <Stats
        items={[
          { icon: <IconUsers />, value: meta?.memberCount ?? "—", label: "Membres" },
          { icon: <IconHash />, value: meta?.channels.length ?? "—", label: "Salons" },
          { icon: <IconTag />, value: meta?.roles.length ?? "—", label: "Rôles" },
          { icon: <IconMessage />, value: templates.length, label: "Modèles d'embed" },
        ]}
      />

      <GroupLabel>Configuration</GroupLabel>
      <FeatureList features={features} />
    </>
  );
}
