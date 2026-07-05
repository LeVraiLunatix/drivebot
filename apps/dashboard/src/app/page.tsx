import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";
import { IconBolt } from "@/components/ui/Icons";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-sm p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-b from-brand to-brand-dark text-white shadow-lg shadow-brand/30">
          <IconBolt width={28} height={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Drivebot</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Dashboard privé — accès réservé au propriétaire.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
