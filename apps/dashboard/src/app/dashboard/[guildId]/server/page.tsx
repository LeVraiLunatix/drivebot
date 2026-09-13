import { assertGuildAccess } from "@/lib/guard";
import { getCommunityOverview } from "@/lib/bot";
import { PageHeader } from "@/components/ui/PageHeader";
import { GroupLabel } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const checkLabels: Record<string, { title: string; description: string }> = {
  newcomersRestricted: {
    title: "Accès des nouveaux membres",
    description: "Les catégories publiques sont masquées au rôle Non vérifiés.",
  },
  rulesVisibleBeforeVerification: {
    title: "Règlement accessible",
    description: "Le règlement reste lisible avant la vérification.",
  },
  verificationVisibleBeforeVerification: {
    title: "Vérification accessible",
    description: "Le panneau et son bouton sont visibles avant validation.",
  },
  verificationHiddenAfterVerification: {
    title: "Salon masqué après validation",
    description: "Le salon de vérification disparaît pour les membres vérifiés.",
  },
};

export default async function ServerOverviewPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await assertGuildAccess(guildId);
  const overview = await getCommunityOverview(guildId);
  const published = overview?.publications.filter((item) => item.published).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Synchronisation Discord"
        title="Serveur & publications"
        description="Les messages officiels et les accès sont relus directement depuis Discord à chaque ouverture."
        action={
          <span className={`pill ${overview ? "pill-ok" : "pill-danger"}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {overview ? "Synchronisé" : "Indisponible"}
          </span>
        }
      />

      {!overview ? (
        <div className="card p-6 text-sm leading-relaxed text-muted">
          Le bot principal ne répond pas. Cette page se remettra à jour dès que le centre de contrôle sera connecté.
        </div>
      ) : (
        <>
          <div className="mb-10 grid gap-3 sm:grid-cols-3">
            <div className="card p-5">
              <p className="eyebrow">Publications</p>
              <p className="display mt-3 text-3xl font-semibold">{published}/{overview.publications.length}</p>
              <p className="mt-2 text-sm text-muted">embeds officiels trouvés</p>
            </div>
            <div className="card p-5">
              <p className="eyebrow">Bot principal</p>
              <p className="display mt-3 text-2xl font-semibold">CordBot</p>
              <p className="mt-2 text-sm text-muted">publication et vérification</p>
            </div>
            <div className="card p-5">
              <p className="eyebrow">Onboarding</p>
              <p className="display mt-3 text-2xl font-semibold">{overview.onboarding.ready ? "Opérationnel" : "À vérifier"}</p>
              <p className="mt-2 text-sm text-muted">permissions calculées en direct</p>
            </div>
          </div>

          <GroupLabel>Parcours de vérification</GroupLabel>
          <div className="card mb-10 overflow-hidden">
            {Object.entries(overview.onboarding.checks).map(([key, valid], index, list) => {
              const copy = checkLabels[key];
              return (
                <div key={key} className="flex items-start gap-4 px-5 py-4" style={{ borderBottom: index < list.length - 1 ? "1px solid var(--line)" : undefined }}>
                  <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm ${valid ? "pill-ok" : "pill-danger"}`}>
                    {valid ? "✓" : "!"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{copy.title}</p>
                    <p className="mt-1 text-sm text-muted">{copy.description}</p>
                  </div>
                  <span className={`pill shrink-0 ${valid ? "pill-ok" : "pill-danger"}`}>{valid ? "Actif" : "Erreur"}</span>
                </div>
              );
            })}
          </div>

          <GroupLabel>Messages officiels</GroupLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {overview.publications.map((publication) => (
              <a
                key={publication.key}
                href={publication.messageUrl ?? undefined}
                target={publication.messageUrl ? "_blank" : undefined}
                rel="noreferrer"
                aria-disabled={!publication.messageUrl}
                className="card card-hover group p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{publication.label}</p>
                    <p className="mt-1 font-mono text-xs text-muted">#{publication.channelName}</p>
                  </div>
                  <span className={`pill ${publication.published ? "pill-ok" : "pill-off"}`}>
                    {publication.published ? "Publié" : "Absent"}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-full bg-wash px-2.5 py-1">{publication.embedCount} embed{publication.embedCount > 1 ? "s" : ""}</span>
                  <span className="rounded-full bg-wash px-2.5 py-1">{publication.sender ?? "Aucun auteur"}</span>
                  {publication.hasComponents && <span className="rounded-full bg-wash px-2.5 py-1">Interactif</span>}
                </div>
                {publication.messageUrl && <p className="mt-4 text-xs font-medium text-accent transition group-hover:translate-x-0.5">Voir sur Discord →</p>}
              </a>
            ))}
          </div>

          <p className="mt-6 text-right font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
            Synchronisé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Paris" }).format(new Date(overview.syncedAt))}
          </p>
        </>
      )}
    </>
  );
}
