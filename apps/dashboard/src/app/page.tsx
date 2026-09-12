import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden px-6 sm:px-10">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 -z-10 size-[600px] rounded-full opacity-20 blur-[100px]" style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }} />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-7">
        <a href="https://cordsuite.app" className="display flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>c.</span>
          cordsuite<span className="text-muted">/ bots</span>
        </a>
        <ThemeToggle />
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 py-12 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
        <section>
          <p className="eyebrow mb-6 text-accent">TON SERVEUR. TES COMMANDES.</p>
          <h1 className="display max-w-xl text-5xl font-semibold leading-[1.06] tracking-tight sm:text-6xl">Tous tes bots.<br /><span style={{ color: "var(--accent)" }}>Un seul endroit.</span></h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">Le centre de contrôle de ton serveur Discord. Configure tes bots, gère ta communauté et garde la main sur chaque détail.</p>
          <div className="mt-9 flex flex-wrap gap-2" aria-label="Fonctionnalités du dashboard">
            {["Présence & activité", "Modération", "Messages", "Rôles & tickets"].map((label) => <span key={label} className="rounded-full border border-line bg-wash px-3 py-2 text-xs text-muted-2">{label}</span>)}
          </div>
          <p className="mt-10 font-mono text-xs text-muted">CORDSUITE.APP <span className="mx-2 opacity-40">/</span> ESPACE PROPRIÉTAIRE</p>
        </section>
        <section className="card w-full max-w-md justify-self-center p-7 sm:p-9 lg:justify-self-end" aria-labelledby="login-heading" style={{ boxShadow: "0 24px 80px color-mix(in srgb, var(--accent) 8%, transparent)" }}>
          <div aria-hidden className="mb-7 grid size-12 place-items-center rounded-2xl border border-line bg-wash text-accent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
          </div>
          <h2 id="login-heading" className="display text-2xl font-semibold tracking-tight">Bienvenue chez toi.</h2>
          <p className="mb-7 mt-3 text-sm leading-relaxed text-muted">Connecte-toi pour retrouver tes bots et les réglages de ton serveur.</p>
          <LoginForm />
          <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">Accès privé, réservé au propriétaire de cordsuite.app.</p>
        </section>
      </div>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 border-t border-line py-6 text-xs text-muted"><span>Cordsuite · Bot Manager</span><a href="https://cordsuite.app" className="hover:text-foreground">Retour à cordsuite.app ↗</a></footer>
    </main>
  );
}
