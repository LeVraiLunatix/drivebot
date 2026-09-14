import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Met à jour uniquement le code du processus existant. Les secrets restent sur Oracle.
const host = "ubuntu@141.253.108.13";
const key = path.join(os.homedir(), ".ssh", "drivebot-oracle.key");
const sshArgs = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-i", key, host];
const ssh = (command, input) => execFileSync("ssh", [...sshArgs, command], { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
const tag = new Date().toISOString().replace(/[^0-9]/g, "");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "drivebot-deploy-"));
const archive = path.join(temporary, "update.tgz");
const remoteArchive = `/tmp/drivebot-update-${tag}.tgz`;
const backup = `/home/ubuntu/drivebot-backups/${tag}`;
execFileSync("tar", ["-czf", archive, "apps/bot/src", "packages/types/src", "packages/database/prisma/schema.prisma"], { stdio: "pipe" });
execFileSync("scp", ["-q", "-i", key, archive, `${host}:${remoteArchive}`], { stdio: "pipe" });
let backedUp = false;
try {
  ssh(`set -eu; cd /home/ubuntu/drivebot; mkdir -p -m 700 ${backup}; tar -czf ${backup}/before.tgz apps/bot/src packages/types/src packages/database/prisma/schema.prisma .env; chmod 600 ${backup}/before.tgz`);
  backedUp = true;
  ssh(`set -eu; cd /home/ubuntu/drivebot; tar -xzf ${remoteArchive}; node node_modules/prisma/build/index.js generate --schema=packages/database/prisma/schema.prisma; node node_modules/typescript/bin/tsc --noEmit -p apps/bot/tsconfig.json`);
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
