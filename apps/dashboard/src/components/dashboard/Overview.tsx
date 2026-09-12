import Link from "next/link";
import type { ReactNode } from "react";

export interface StatItem {
  icon: ReactNode;
  value: string | number;
  label: string;
}

/**
 * Les quatre compteurs dans une seule carte séparée par des filets, plutôt
 * qu'en quatre cartes flottantes : ils se lisent comme une seule mesure du
 * serveur, et l'écran ne part pas en mosaïque.
 */
export function Stats({ items }: { items: StatItem[] }) {
  return (
    <div className="card mb-10 grid grid-cols-2 sm:grid-cols-4">
      {items.map((s, i) => (
        <div
          key={s.label}
          /* Filet à gauche sauf en début de rangée. La grille passe de 2 à 4
             colonnes à `sm` : en 2 colonnes les cases 2 et 3 ouvrent une
             nouvelle rangée (filet horizontal), en 4 colonnes tout est sur une
             ligne — d'où les deux jeux de bordures. */
          className={[
            "p-5",
            i % 2 !== 0 ? "border-l" : "",
            i >= 2 ? "border-t sm:border-t-0" : "",
            i !== 0 ? "sm:border-l" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="mb-3 block opacity-50" style={{ color: "var(--accent)" }}>
            {s.icon}
          </span>
          <p className="display text-3xl font-semibold leading-none text-foreground">
            {s.value}
          </p>
          <p className="eyebrow mt-2">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export interface Feature {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
  enabled: boolean;
}

/** Liste unique à filets, dans l'esprit de la grille produits du site. */
export function FeatureList({ features }: { features: Feature[] }) {
  return (
    <div className="card overflow-hidden">
      {features.map((f, i) => (
        <Link
          key={f.href}
          href={f.href}
          className="group flex items-center gap-4 px-5 py-4 transition hover:bg-wash"
          style={{
            borderBottom: i === features.length - 1 ? undefined : "1px solid var(--line)",
          }}
        >
          <span
            className="shrink-0 opacity-60 transition group-hover:opacity-100"
            style={{ color: "var(--muted)" }}
          >
            {f.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">{f.title}</span>
            <span className="mt-0.5 block truncate text-sm text-muted">{f.desc}</span>
          </span>
          <span className={`pill shrink-0 ${f.enabled ? "pill-ok" : "pill-off"}`}>
            {f.enabled ? "Activé" : "Inactif"}
          </span>
        </Link>
      ))}
    </div>
  );
}
