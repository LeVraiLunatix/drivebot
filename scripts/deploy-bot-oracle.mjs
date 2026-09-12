import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

// Met à jour le processus existant uniquement. Les bots secondaires sont désactivés par défaut.
const host = "ubuntu@141.253.108.13";
const key = path.join(os.homedir(), ".ssh", "drivebot-oracle.key");
const sshArgs = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-i", key, host];
const ssh = (command, input) => execFileSync("ssh", [...sshArgs, command], { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
const tag = new Date().toISOString().replace(/[^0-9]/g, "");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "drivebot-deploy-"));
const archive = path.join(temporary, "update.tgz");
const remoteArchive = `/tmp/drivebot-update-${tag}.tgz`;
const backup = `/home/ubuntu/drivebot-backups/${tag}`;
const env = dotenv.parse(fs.readFileSync(".env"));
const updates = Object.fromEntries(["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "DISCORD_DEV_GUILD_ID", "MANAGED_BOTS_JSON"].map((key) => [key, env[key]]));
if (Object.values(updates).some((value) => !value)) throw new Error("Configuration manquante.");
execFileSync("tar", ["-czf", archive, "apps/bot/src", "packages/types/src"], { stdio: "pipe" });
execFileSync("scp", ["-q", "-i", key, archive, `${host}:${remoteArchive}`], { stdio: "pipe" });
let backedUp = false;
try {
  ssh(`set -eu; cd /home/ubuntu/drivebot; mkdir -p -m 700 ${backup}; tar -czf ${backup}/before.tgz apps/bot/src packages/types/src .env; chmod 600 ${backup}/before.tgz`);
  backedUp = true;
  ssh(`set -eu; cd /home/ubuntu/drivebot; tar -xzf ${remoteArchive}; node node_modules/typescript/bin/tsc --noEmit -p apps/bot/tsconfig.json`);
  const python = "import sys,json,pathlib,re,os; p=pathlib.Path('/home/ubuntu/drivebot/.env'); s=p.read_text(); values=json.load(sys.stdin); " +
    "s='\\n'.join(line for line in s.splitlines() if not any(line.startswith(k+'=') for k in values)); " +
    "s+='\\n'+''.join(k+'='+chr(39)+v+chr(39)+'\\n' for k,v in values.items()); " +
    "p.write_text(s); os.chmod(p,0o600)";
  const shellQuote = (value) => "'" + value.replaceAll("'", "'\"'\"'") + "'";
  ssh(`python3 -c ${shellQuote(python)}`, JSON.stringify(updates));
  console.log(ssh("cd /home/ubuntu/drivebot && pm2 restart drivebot --update-env"));
  console.log(`Déploiement terminé. Sauvegarde : ${backup}/before.tgz`);
} catch (error) {
  if (backedUp) console.error(`Échec. Sauvegarde disponible : ${backup}/before.tgz`);
  // La sortie des sous-processus peut contenir des détails privés : message générique uniquement.
  throw new Error("Déploiement interrompu. Vérifier le serveur avant de relancer.");
} finally {
  ssh(`rm -f ${remoteArchive}`);
  fs.unlinkSync(archive);
  fs.rmdirSync(temporary);
}
