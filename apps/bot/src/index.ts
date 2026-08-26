import { Events } from "discord.js";
import { config } from "./config.js";
import { client } from "./client.js";
import { startHealthServer } from "./health.js";
import { startStatusReports } from "./lib/statusReport.js";
import { onGuildMemberAdd } from "./events/guildMemberAdd.js";
import { onGuildMemberRemove } from "./events/guildMemberRemove.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onThreadCreate } from "./events/threadCreate.js";
import { onMessageCreate } from "./events/messageCreate.js";

client.once(Events.ClientReady, (c) => {
  console.log(`[bot] connecté en tant que ${c.user.tag}`);
  startStatusReports();
});

client.on(Events.GuildMemberAdd, onGuildMemberAdd);
client.on(Events.GuildMemberRemove, onGuildMemberRemove);
client.on(Events.InteractionCreate, onInteractionCreate);
client.on(Events.ThreadCreate, onThreadCreate);
client.on(Events.MessageCreate, onMessageCreate);

// Serveur HTTP (santé UptimeRobot + reload de config depuis le dashboard).
startHealthServer();

client.login(config.token);

// Arrêt propre.
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    console.log(`[bot] arrêt (${sig})`);
    client.destroy();
    process.exit(0);
  });
}
