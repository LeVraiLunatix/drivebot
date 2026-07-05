import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10rem,rgba(88,101,242,0.18),transparent)]" />
        {children}
      </body>
    </html>
  );
}
