import assert from "node:assert/strict";
import fs from "node:fs";
import dotenv from "dotenv";

// Lecture seule : connexion du propriétaire et chargement des pages, aucune action Discord.
const env = dotenv.parse(fs.readFileSync("apps/dashboard/.env.local"));
const base = process.env.DASHBOARD_TEST_URL || env.AUTH_URL || "http://localhost:3000";
const jar = new Map();
function cookies(response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const at = pair.indexOf("=");
    jar.set(pair.slice(0, at), pair.slice(at + 1));
  }
}
const cookieHeader = () => [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
const guest = await fetch(`${base}/dashboard/${env.DRIVECORD_GUILD_ID}/bots`, { redirect: "manual" });
assert.equal(guest.status, 307, "Une page privée doit rediriger un visiteur sans session.");
const csrf = await fetch(`${base}/api/auth/csrf`);
assert.equal(csrf.status, 200);
cookies(csrf);
const { csrfToken } = await csrf.json();
const login = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieHeader() },
  body: new URLSearchParams({ csrfToken, password: env.DASHBOARD_PASSWORD, callbackUrl: `${base}/dashboard` }),
  redirect: "manual",
});
cookies(login);
const session = await fetch(`${base}/api/auth/session`, { headers: { Cookie: cookieHeader() } }).then((r) => r.json());
assert.ok(session.user, "L'authentification doit créer une session utilisateur.");
console.log("Accès privé et authentification : OK");
for (const path of ["", "bots", "moderation", "suggestions", "welcome", "tickets", "status", "settings", "embeds", "verification", "reaction-roles"]) {
  const response = await fetch(`${base}/dashboard/${env.DRIVECORD_GUILD_ID}${path ? `/${path}` : ""}`, {
    headers: { Cookie: cookieHeader() }, signal: AbortSignal.timeout(45_000), redirect: "manual",
  });
  assert.equal(response.status, 200, `${path}: HTTP inattendu`);
  const html = await response.text();
  assert.ok(!/Chargement impossible|NEXT_HTTP_ERROR_FALLBACK|Application error|An error occurred in the Server Components render/.test(html), `${path}: erreur de rendu`);
  if (path === "bots") {
    const root = dotenv.parse(fs.readFileSync(".env"));
    const managed = JSON.parse(root.MANAGED_BOTS_JSON || "[]");
    for (const token of [root.DISCORD_TOKEN, ...managed.map((b) => b.token)]) {
      if (token) assert.equal(html.includes(token), false, "Un token ne doit jamais apparaître dans la réponse HTML.");
    }
    for (const bot of managed) assert.ok(html.includes(bot.id), "Chaque bot configuré doit apparaître dans le dashboard.");
  }
  console.log(`${path || "accueil"} : OK`);
}
