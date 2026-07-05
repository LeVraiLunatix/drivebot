import { createServer } from "node:http";
import { config } from "./config.js";
import { client } from "./client.js";
import { invalidateGuildConfig } from "./lib/guildConfig.js";
import { getGuildMeta } from "./lib/guildMeta.js";
import { sendEmbedToChannel } from "./lib/sendEmbed.js";
import { publishTicketPanel } from "./lib/tickets.js";

/** Lit et parse un corps de requête JSON. */
function readJson(req: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("invalid json"));
      }
    });
  });
}

/** Serveur HTTP minimal :
 *  - GET /  et  GET /health        → 200 (pingé par UptimeRobot pour garder le
 *    service web Render éveillé, ce qui maintient la connexion gateway).
 *  - GET /internal/guilds          → IDs des serveurs où le bot est présent.
 *  - GET /internal/guilds/:id/meta → salons + rôles d'un serveur (menus dashboard).
 *  - POST /internal/reload         → invalide le cache de config d'un serveur.
 *  Les routes /internal/* sont protégées par un secret partagé. */
export function startHealthServer(): void {
  const server = createServer((req, res) => {
    const method = req.method ?? "GET";
    // Normalise : retire la query string et un éventuel slash final.
    const url = (req.url ?? "/").split("?")[0].replace(/\/+$/, "") || "/";

    // Santé : accepte GET ET HEAD (UptimeRobot ping en HEAD par défaut).
    if ((method === "GET" || method === "HEAD") && (url === "/" || url === "/health")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(method === "HEAD" ? undefined : JSON.stringify({ status: "ok", uptime: process.uptime() }));
      return;
    }

    // Toutes les routes internes exigent le secret.
    const isInternal = url.startsWith("/internal/");
    if (isInternal && req.headers["x-internal-secret"] !== config.internalSecret) {
      res.writeHead(401).end();
      return;
    }

    if (method === "GET" && url === "/internal/guilds") {
      const ids = [...client.guilds.cache.keys()];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ guildIds: ids }));
      return;
    }

    const metaMatch = url.match(/^\/internal\/guilds\/(\d+)\/meta$/);
    if (method === "GET" && metaMatch) {
      const meta = getGuildMeta(metaMatch[1]);
      if (!meta) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(meta));
      return;
    }

    const sendMatch = url.match(/^\/internal\/guilds\/(\d+)\/send-embed$/);
    if (method === "POST" && sendMatch) {
      readJson(req)
        .then(async (body) => {
          const { channelId, embed } = (body ?? {}) as {
            channelId?: string;
            embed?: import("@drivebot/types").EmbedData;
          };
          if (!channelId || !embed) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "channelId et embed requis." }));
            return;
          }
          const result = await sendEmbedToChannel(sendMatch[1], channelId, embed);
          res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        })
        .catch(() => res.writeHead(400).end());
      return;
    }

    const panelMatch = url.match(/^\/internal\/guilds\/(\d+)\/ticket-panel$/);
    if (method === "POST" && panelMatch) {
      publishTicketPanel(panelMatch[1])
        .then((result) => {
          res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        })
        .catch(() => res.writeHead(500).end());
      return;
    }

    if (method === "POST" && url === "/internal/reload") {
      readJson(req)
        .then((body) => {
          const { guildId } = (body ?? {}) as { guildId?: string };
          if (typeof guildId === "string") invalidateGuildConfig(guildId);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ reloaded: guildId ?? null }));
        })
        .catch(() => res.writeHead(400).end());
      return;
    }

    res.writeHead(404).end();
  });

  server.listen(config.port, () => {
    console.log(`[health] écoute sur le port ${config.port}`);
  });
}
