import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-b from-brand/20 to-brand/5 text-brand">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
