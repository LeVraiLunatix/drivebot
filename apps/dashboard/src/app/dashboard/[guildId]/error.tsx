"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <section className="card p-6" role="alert">
    <h1 className="text-xl font-semibold">Chargement impossible</h1>
    <p className="mt-3 text-sm text-muted">Le dashboard ne peut pas charger les données. Vérifie la connexion à la base et au bot, puis réessaie.</p>
    <button className="btn-primary mt-5" onClick={reset}>Réessayer</button>
  </section>;
}
