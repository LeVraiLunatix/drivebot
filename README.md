# Drivebot

Bot Discord officiel de [Drivecord](https://drivecord.app), contrôlable via un dashboard web (façon DraftBot) : paramètres serveur, embed builder, messages de bienvenue/autorole, modération & logs.

## Architecture (monorepo npm workspaces)

```
apps/
  bot/          discord.js v14 + serveur HTTP santé (UptimeRobot) + API interne de reload
  dashboard/    Next.js 16 + Auth.js v5 (Discord OAuth)  ← à venir
packages/
  database/     schéma Prisma partagé (config par serveur) + client
  types/        types TS partagés bot ↔ dashboard
```

Le **dashboard** écrit la config par serveur en base ; le **bot** la lit avec un cache mémoire, invalidé via `POST /internal/reload` quand le dashboard sauvegarde.

## Prérequis

- Node.js 20+
- Une base **PostgreSQL** dédiée (Render Postgres, Neon, Supabase…)
- Une application Discord ([Developer Portal](https://discord.com/developers/applications)) avec un bot, et l'intent privilégié **Server Members** activé (Bot → Privileged Gateway Intents).

## Installation

```bash
npm install
cp .env.example .env      # puis renseigne les valeurs
npm run db:generate       # génère le client Prisma
npm run db:push           # crée les tables dans ta base
```

## Lancer le bot en local

```bash
npm run bot:deploy-commands   # enregistre les slash commands (instantané si DISCORD_DEV_GUILD_ID est défini)
npm run bot:dev               # démarre le bot en watch
```

Vérifie la santé : `curl http://localhost:3001/health` → `{"status":"ok",...}`.

## Lancer le dashboard en local

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local   # puis renseigne les valeurs
npx auth secret                                            # génère AUTH_SECRET (dans apps/dashboard)
npm run dashboard:dev                                      # http://localhost:3000
```

Dans le [Developer Portal](https://discord.com/developers/applications) → OAuth2, ajoute la
redirect URL `http://localhost:3000/api/auth/callback/discord` (et l'équivalent en prod).

## Déploiement (Render + UptimeRobot)

1. Pousse ce repo sur GitHub, puis **New → Blueprint** sur Render (il lit `render.yaml`).
2. Renseigne les variables d'env (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `INTERNAL_API_SECRET`, `DATABASE_URL`).
3. Une fois déployé, crée un moniteur **UptimeRobot** de type HTTP(s) vers
   `https://<ton-service>.onrender.com/health`, intervalle **5 min**.
   → cela empêche le service gratuit de s'endormir et **maintient la connexion gateway Discord** 24/7 sans allumer ton PC.

## Variables d'environnement

Voir [`.env.example`](.env.example). `INTERNAL_API_SECRET` doit être **identique** côté bot et côté dashboard.

## Roadmap

- [x] Fondation monorepo + schéma Prisma + bot (bienvenue, autorole, départ, slash commands, santé/reload)
- [x] Dashboard Next.js : login Discord OAuth + sélecteur de serveurs (bot présent / à inviter)
- [x] Config **Bienvenue/autorole** : page dashboard (menus salons/rôles) → DB → reload bot
- [x] Config **Paramètres** (langue, préfixe) + **Modération** (salon de logs + historique)
- [x] **Embed builder** visuel avec preview live (envoi dans un salon + modèles sauvegardés)
- [x] **Commandes de modération** `/kick` `/ban` `/timeout` `/warn` + logs dans le salon configuré

Après ajout/modif de commandes slash, lancer `npm run bot:deploy-commands`.
