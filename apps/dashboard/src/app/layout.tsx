import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  variable: "--font-space",
  display: "swap",
  weight: "300 700",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin-variable.woff2",
  variable: "--font-jet",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  title: "Drivebot — Dashboard",
  description: "Gère Drivebot sur ton serveur Discord Drivecord.",
};

/**
 * Posé avant le premier rendu pour éviter le flash de thème : lire le thème
 * dans un `useEffect` laisse toujours passer une frame avec la mauvaise
 * palette. `try` parce que `localStorage` jette en navigation privée stricte.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("drivebot-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{ background: "var(--glow)" }}
        />
        {children}
      </body>
    </html>
  );
}
