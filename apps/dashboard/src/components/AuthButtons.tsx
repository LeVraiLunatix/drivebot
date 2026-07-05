import { logout } from "@/lib/auth-actions";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
      >
        Se déconnecter
      </button>
    </form>
  );
}
