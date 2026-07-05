import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// npm lance les scripts de workspace depuis apps/bot : on charge explicitement
// le .env de la racine du monorepo (puis un .env local s'il existe, sans écraser).
const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../../../.env") });
loadEnv(); // apps/bot/.env éventuel, en complément

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export const config = {
  token: required("DISCORD_TOKEN"),
  clientId: required("DISCORD_CLIENT_ID"),
  devGuildId: process.env.DISCORD_DEV_GUILD_ID || "",
  internalSecret: required("INTERNAL_API_SECRET"),
  // Render fournit PORT ; fallback 3001 en local.
  port: Number(process.env.PORT ?? 3001),
} as const;
