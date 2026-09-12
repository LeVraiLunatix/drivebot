# Drivebot

Bot Discord officiel de [Drivecord](https://drivecord.app), contrôlable via un dashboard web (façon DraftBot) : paramètres serveur, embed builder, messages de bienvenue/autorole, modération & logs.

## Architecture (monorepo npm workspaces)

```
apps/
  bot/          discord.js v14 + serveur HTTP santé (UptimeRobot) + API interne de reload
  dashboard/    Next.js 16 + Auth.js v5 (mot de passe propriétaire)
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

Le dashboard est **privé** : accès par un mot de passe unique (`DASHBOARD_PASSWORD`), et il ne gère qu'un seul serveur (`DRIVECORD_GUILD_ID`).

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local   # puis renseigne les valeurs
npx auth secret                                            # génère AUTH_SECRET (dans apps/dashboard)
npm run dashboard:dev                                      # http://localhost:3000
```

## Déploiement du bot (Render + UptimeRobot)

1. **New → Blueprint** sur Render (il lit `render.yaml`).
2. Variables d'env : `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `INTERNAL_API_SECRET`, `DATABASE_URL`.
3. Crée un moniteur **UptimeRobot** HTTP(s) vers `https://<service>.onrender.com/health`, intervalle **5 min**
   → empêche la mise en veille du service gratuit et **maintient la gateway Discord** 24/7.

## Déploiement du dashboard (Vercel)

1. **New Project** → importe le repo GitHub.
2. **Root Directory** = `apps/dashboard` (Next.js détecté automatiquement ; le build lance `prisma generate`).
3. Variables d'env : `AUTH_SECRET`, `DASHBOARD_PASSWORD`, `DRIVECORD_GUILD_ID`, `DATABASE_URL`,
   `INTERNAL_API_SECRET`, et `BOT_INTERNAL_URL` = l'URL Render du bot (`https://<service>.onrender.com`).
   `INTERNAL_API_SECRET` doit être **identique** à celui du bot.

## Variables d'environnement

Voir [`.env.example`](.env.example). `INTERNAL_API_SECRET` doit être **identique** côté bot et côté dashboard.

## Roadmap

Le dashboard propose aussi **Mes bots** (inventaire Discord, rechargement de configuration),
les actions de modération web avec confirmation et historique, et les réglages de suggestions
sur un forum. Le statut vérifie la connexion Discord et s'actualise toutes les 30 secondes.
Le cache de configuration expire après 30 secondes même si le rappel HTTP échoue.

Les bots fournis dans `MANAGED_BOTS_JSON` sont pilotables individuellement : connexion,
présence, activité, surnom du serveur, nom global et publication de messages (avec confirmation).
Au premier démarrage, les bots secondaires restent déconnectés jusqu'à leur activation
dans **Mes bots**. Drivebot reste connecté pour les modules de gestion du serveur.
Les préférences sont enregistrées dans `data/bot-controls.json` sur le serveur :
ce fichier ne contient aucun token et doit être conservé lors des déploiements.
Les bots tiers sans token, comme Patreon, restent seulement inventoriés.
Les tokens seuls ne fournissent pas des fonctionnalités métier comme la musique ou les quiz :
celles-ci nécessitent du code spécifique en plus de ces commandes de gestion Discord.
Ces nouvelles commandes exigent de déployer aussi la version correspondante de `apps/bot`.
Le dashboard ne démarre ni ne redémarre les processus du VPS.

Pour importer explicitement le fichier de tokens du propriétaire :
`node scripts/import-bot-tokens.mjs "D:/Cordsuite Bot discord token.txt"`.
Les secrets sont écrits uniquement dans `.env`, ignoré par Git.
`node scripts/deploy-bot-oracle.mjs` sauvegarde le code et `.env` sur Oracle,
met à jour les sources et les tokens, puis redémarre seulement le processus Drivebot existant.
Il ne publie pas le dashboard sur Vercel et ne modifie pas Sona.

Validation locale : `node --import tsx --test apps/bot/src/lib/dashboardControl.test.ts`,
`npm run dashboard:build`, puis, dashboard démarré,
`node scripts/dashboard-smoke.mjs` (authentification et lecture des pages, aucune sanction).
Le test lit `apps/dashboard/.env.local` sans afficher ses secrets ; son `AUTH_URL`
doit correspondre au port utilisé (`DASHBOARD_TEST_URL` permet de cibler une autre URL locale).

Pour accéder à Oracle en local sans exposer le secret sur HTTP public :
`ssh -N -L 127.0.0.1:3108:127.0.0.1:3001 -i ~/.ssh/drivebot-oracle.key ubuntu@141.253.108.13`,
puis `BOT_INTERNAL_URL=http://127.0.0.1:3108` dans le fichier local.
Le tunnel doit rester ouvert ; en production, utiliser une connexion privée ou HTTPS.

- [x] Fondation monorepo + schéma Prisma + bot (bienvenue, autorole, départ, slash commands, santé/reload)
- [x] Dashboard Next.js : accès par mot de passe (propriétaire), gestion du seul serveur Drivecord
- [x] Config **Bienvenue/autorole** : page dashboard (menus salons/rôles) → DB → reload bot
- [x] Config **Paramètres** (langue, préfixe) + **Modération** (salon de logs + historique)
- [x] **Embed builder** visuel avec preview live (envoi dans un salon + modèles sauvegardés)
- [x] **Commandes de modération** `/kick` `/ban` `/timeout` `/warn` + logs dans le salon configuré

Après ajout/modif de commandes slash, lancer `npm run bot:deploy-commands`.
