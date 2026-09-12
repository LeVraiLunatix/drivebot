import { logout } from "@/lib/auth-actions";
import { IconLogout } from "@/components/ui/Icons";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-sm transition hover:bg-wash"
        style={{ color: "var(--muted)" }}
      >
        <IconLogout width={17} height={17} />
        <span className="hidden sm:inline">Se déconnecter</span>
      </button>
    </form>
  );
}
