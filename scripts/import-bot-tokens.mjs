import fs from "node:fs";
import assert from "node:assert/strict";
import dotenv from "dotenv";

// Import explicite depuis un fichier local fourni par le propriétaire. Aucun secret affiché.
assert.ok(process.argv[2], "Indiquer le fichier de tokens à importer.");
const blocks = [];
let current;
for (const line of fs.readFileSync(process.argv[2], "utf8").split(/\r?\n/)) {
  const text = line.trim();
  if (!text) continue;
  if (!text.includes(":")) { current = { name: text }; blocks.push(current); continue; }
  if (!current) continue;
  const token = text.match(/^Token\s*:\s*(.+)$/i);
  const id = text.match(/^ID App\s*:\s*(\d+)$/i);
  if (token) current.token = token[1].trim();
  if (id) current.id = id[1];
}
const bots = blocks.filter((bot) => bot.token && /^\d{17,20}$/.test(bot.id));
const primary = bots.find((bot) => bot.name.toLowerCase() === "drivebot");
assert.ok(primary, "Drivebot absent du fichier.");
const file = ".env";
let text = fs.readFileSync(file, "utf8");
const dashboard = dotenv.parse(fs.readFileSync("apps/dashboard/.env.local"));
const values = {
  DISCORD_TOKEN: primary.token, DISCORD_CLIENT_ID: primary.id,
  DISCORD_DEV_GUILD_ID: dashboard.DRIVECORD_GUILD_ID,
  MANAGED_BOTS_JSON: JSON.stringify(bots.filter((bot) => bot.id !== primary.id)),
  INTERNAL_API_SECRET: dashboard.INTERNAL_API_SECRET,
  DATABASE_URL: dashboard.DATABASE_URL,
};
for (const [key, value] of Object.entries(values)) {
  if (!value) continue;
  assert.ok(!value.includes("'"), "Valeur contenant une apostrophe non prise en charge.");
  text = text.replace(new RegExp(`^${key}=.*$`, "gm"), "");
  text += `\n${key}='${value}'\n`;
}
fs.writeFileSync(file, text);
console.log(`${bots.length} bots importés dans .env. Aucun token écrit dans le dashboard.`);
