import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { commands } from "./commands/index.js";

/** Enregistre les slash commands auprès de Discord.
 *  - En dev (DISCORD_DEV_GUILD_ID défini) : déploiement instantané sur ce serveur.
 *  - Sinon : déploiement global (propagation jusqu'à ~1h). */
async function main() {
  const body = commands.map((c) => c.data.toJSON());
  const rest = new REST().setToken(config.token);

  if (config.devGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.devGuildId),
      { body },
    );
    console.log(`✅ ${body.length} commande(s) déployée(s) sur le serveur de dev.`);
  } else {
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    console.log(`✅ ${body.length} commande(s) déployée(s) globalement.`);
  }
}

main().catch((err) => {
  console.error("Échec du déploiement des commandes :", err);
  process.exit(1);
});
