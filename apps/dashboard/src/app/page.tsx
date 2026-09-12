import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="fixed right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[22rem]">
        <p className="eyebrow mb-5">Accès restreint</p>

        <h1 className="display text-[2.5rem] font-semibold leading-[1.05] text-foreground">
          Drivebot
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Le bot Discord de Drivecord. Ce tableau de bord est privé — il est
          réservé au propriétaire du serveur.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <div className="mt-10 h-px" style={{ background: "var(--line)" }} />
        <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
          <a href="https://cordsuite.app" className="transition hover:text-foreground">
            cordsuite.app
          </a>
          <span className="mx-2 opacity-40">·</span>
          <a href="https://drivecord.app" className="transition hover:text-foreground">
            drivecord.app
          </a>
        </p>
      </div>
    </main>
  );
}
