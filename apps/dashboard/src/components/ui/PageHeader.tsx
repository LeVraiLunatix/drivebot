import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  action,
}: {
  title: string;
  description?: string;
  /** Micro-titre mono au-dessus du titre. Défaut : rien. */
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div
              className="mt-1 grid size-10 shrink-0 place-items-center rounded-[var(--radius)] border"
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
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h1 className="display text-[1.75rem] font-semibold leading-tight text-foreground sm:text-[2rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-7 h-px" style={{ background: "var(--line)" }} />
    </header>
  );
}
