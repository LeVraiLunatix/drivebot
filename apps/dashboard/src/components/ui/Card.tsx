import type { ReactNode } from "react";

/** Carte de section avec titre, sous-titre et éventuelle icône. */
export function SectionCard({
  title,
  description,
  icon,
  children,
  aside,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      {(title || aside) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div
                className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius)] border"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--wash)",
                  color: "var(--accent)",
                }}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h2 className="display text-[0.9375rem] font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
              )}
            </div>
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** Libellé + champ. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/**
 * Intertitre de groupe — le pendant des chapitres numérotés du site
 * (« 01 — LES OUTILS »). Le filet occupe l'espace restant.
 */
export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="eyebrow whitespace-nowrap">{children}</span>
      <span className="h-px flex-1" style={{ background: "var(--line)" }} />
    </div>
  );
}
