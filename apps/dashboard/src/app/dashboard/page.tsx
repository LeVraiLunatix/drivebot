import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DRIVECORD_GUILD_ID } from "@/lib/guard";

/** Dashboard = un seul serveur (Drivecord) : on redirige directement dessus. */
export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");
  redirect(`/dashboard/${DRIVECORD_GUILD_ID}`);
}
