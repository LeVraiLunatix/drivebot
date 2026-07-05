import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drivebot — Dashboard",
  description: "Gère Drivebot sur ton serveur Discord Drivecord.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
