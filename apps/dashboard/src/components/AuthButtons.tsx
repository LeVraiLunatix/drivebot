import { logout } from "@/lib/auth-actions";
import { IconLogout } from "@/components/ui/Icons";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-neutral-100"
      >
        <IconLogout className="text-neutral-500" />
        Se déconnecter
      </button>
    </form>
  );
}
