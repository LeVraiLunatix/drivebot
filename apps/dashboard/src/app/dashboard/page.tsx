import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DRIVECORD_GUILD_ID } from "@/lib/guard";

/** Dashboard = un seul serveur (Drivecord) : on redirige directement dessus. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!DRIVECORD_GUILD_ID) return <main className="p-8"><h1 className="text-xl font-semibold">Serveur à configurer</h1><p className="mt-3">Renseigne DRIVECORD_GUILD_ID avec l’identifiant du serveur Discord cordsuite.app, puis redémarre le dashboard.</p></main>;
  redirect(`/dashboard/${DRIVECORD_GUILD_ID}`);
}
