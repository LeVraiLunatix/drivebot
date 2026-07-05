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
              <div className="mt-0.5 grid size-9 place-items-center rounded-xl bg-brand/15 text-brand">
                {icon}
              </div>
            )}
            <div>
              {title && <h2 className="font-semibold text-neutral-100">{title}</h2>}
              {description && (
                <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
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
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-600">{hint}</span>}
    </label>
  );
}
