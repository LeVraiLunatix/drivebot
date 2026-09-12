"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/ui/Icons";

const KEY = "drivebot-theme";

/**
 * Bascule clair / sombre.
 *
 * Le thème est déjà posé sur <html> par le script inline du layout (avant le
 * premier rendu, pour éviter le flash). Ce composant se contente de lire l'état
 * réel du DOM au montage puis de l'écrire — d'où le `mounted` : rendre l'icône
 * avant l'hydratation produirait un décalage serveur/client.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme !== "light");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* navigation privée stricte : la bascule reste valable pour la session */
    }
    setDark(!dark);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer en clair" : "Passer en sombre"}
      title={dark ? "Passer en clair" : "Passer en sombre"}
      className={`grid size-9 place-items-center rounded-[var(--radius)] border transition hover:bg-wash ${className}`}
      style={{ borderColor: "var(--line)", color: "var(--muted)" }}
    >
      {mounted && (dark ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />)}
    </button>
  );
}
