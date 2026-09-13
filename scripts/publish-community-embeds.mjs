import dotenv from "dotenv";
import { REST, Routes } from "discord.js";

dotenv.config();

const guildId = process.env.DISCORD_DEV_GUILD_ID;
const managed = JSON.parse(process.env.MANAGED_BOTS_JSON || "[]");
const cordBot = managed.find((bot) => /^cordbot$/i.test(bot.name));
if (!guildId || !cordBot?.id || !cordBot?.token) throw new Error("Serveur ou CordBot manquant.");

const channels = {
  welcome: "1518688570011811951",
  rules: "1521281341407232172",
  vision: "1518716430340849795",
  tools: "1548282792670924882",
  links: "1523472991076225024",
  verification: "1523469828403368008",
  faq: "1518688832772509776",
  documentation: "1518688646566252714",
};

const bots = Object.fromEntries(
  [
    { id: process.env.DISCORD_CLIENT_ID, name: "Drivebot" },
    ...managed.map(({ id, name }) => ({ id, name })),
  ].map((bot) => [bot.name.toLowerCase(), bot.id]),
);

const rest = new REST({ version: "10", timeout: 15_000 }).setToken(cordBot.token);
const PURPLE = 0x8b4cf5;
const BLUE = 0x6255ed;
const PINK = 0xc336ed;
const DARK = 0x4e185e;

const footer = (key) => ({ text: `Cordsuite • ${key}` });
const mention = (name) => `<@${bots[name.toLowerCase()]}>`;

const publications = [
  {
    channelId: channels.welcome,
    key: "accueil officiel",
    embed: {
      title: "Bienvenue dans Cordsuite ☁️",
      description:
        "Un même espace pour découvrir Cordsuite, suivre ses outils et obtenir de l’aide. **CordBot** est le bot principal du serveur et coordonne les services de la suite.",
      color: PURPLE,
      fields: [
        { name: "1 • Commence ici", value: `Lis <#${channels.rules}>, puis passe dans <#${channels.verification}> pour accéder au serveur.`, inline: false },
        { name: "2 • Découvre la suite", value: `Retrouve chaque produit et son bot dans <#${channels.tools}>.`, inline: false },
        { name: "3 • Rejoins la communauté", value: "Discute, partage tes créations et suis les annonces officielles.", inline: false },
      ],
      footer: footer("accueil officiel"),
    },
  },
  {
    channelId: channels.rules,
    key: "règlement officiel",
    embeds: [
      {
        title: "Règlement de Cordsuite 📜",
        description:
          "Bienvenue dans la communauté. En restant sur le serveur, tu acceptes ce règlement ainsi que les [Conditions d’utilisation](https://discord.com/terms) et les [Règles de la communauté](https://discord.com/guidelines) de Discord.",
        color: PURPLE,
      },
      {
        title: "🤝 Respect et comportement",
        description:
          "**01 — Respecte chaque membre**\nLes insultes, humiliations, provocations répétées et attaques personnelles n’ont pas leur place ici.\n\n**02 — Aucune discrimination**\nLe harcèlement, les propos haineux, les menaces et toute discrimination sont interdits.\n\n**03 — Garde les échanges constructifs**\nUn désaccord reste une discussion. Évite les conflits publics et contacte le staff si la situation se bloque.",
        color: BLUE,
      },
      {
        title: "💬 Messages et contenus",
        description:
          "**04 — Publie dans le bon salon**\nRespecte le sujet de chaque espace. Les commandes de bots vont dans le salon prévu.\n\n**05 — Pas de spam**\nÉvite les messages répétés, le flood, les mentions abusives, les majuscules excessives et les réactions en masse.\n\n**06 — Contenus autorisés uniquement**\nAucun contenu illégal, sexuel, choquant, malveillant, dangereux ou destiné à contourner la sécurité d’un service.",
        color: PURPLE,
      },
      {
        title: "🔐 Sécurité et vie privée",
        description:
          "**07 — Protège les informations privées**\nNe publie pas de données personnelles, conversations privées ou fichiers appartenant à quelqu’un sans son accord.\n\n**08 — Ne partage jamais de secret**\nLes mots de passe, tokens, clés API, codes de connexion et informations bancaires doivent rester privés.\n\n**09 — Publicité sur autorisation**\nLes promotions, partenariats, invitations vers d’autres serveurs et messages privés publicitaires nécessitent l’accord du staff.",
        color: DARK,
      },
      {
        title: "🛡️ Modération",
        description:
          "**10 — Respecte les décisions du staff**\nSelon la gravité et la répétition, une infraction peut entraîner un avertissement, une restriction, une exclusion temporaire ou un bannissement. Les tentatives de contournement aggravent la sanction.\n\nPour contester une décision ou signaler un problème, ouvre une demande au support avec les faits et les éléments utiles.",
        color: PINK,
        footer: footer("règlement officiel"),
      },
    ],
  },
  {
    channelId: channels.vision,
    key: "parti pris",
    embed: {
      title: "Notre parti pris 🧭",
      description: "Cordsuite rassemble des outils simples, cohérents et connectés, pensés pour rester agréables à utiliser au quotidien.",
      color: DARK,
      fields: [
        { name: "Simple par défaut", value: "Des interfaces claires et des fonctions utiles, sans complexité ajoutée pour rien.", inline: true },
        { name: "Respectueux", value: "La confidentialité et le contrôle de tes données font partie du produit.", inline: true },
        { name: "Une seule suite", value: "Chaque outil garde sa spécialité tout en partageant la même identité Cordsuite.", inline: true },
      ],
      footer: footer("parti pris"),
    },
  },
  {
    channelId: channels.tools,
    key: "catalogue des outils",
    embed: {
      title: "Les outils Cordsuite 🧩",
      description: `${mention("CordBot")} est le **bot principal de Cordsuite**. Il coordonne le serveur, les informations générales et l’état de la suite. Chaque outil dispose ensuite de son propre bot spécialisé.`,
      color: PURPLE,
      fields: [
        { name: "☁️ Drivecord", value: `[Stockage et partage de fichiers](https://drivecord.app)\nBot : ${mention("Drivebot")} • Disponible`, inline: true },
        { name: "🎙️ Tunecord", value: `[Hébergement de podcasts](https://tunecord.vercel.app)\nBot : ${mention("Tunebot")} • Disponible`, inline: true },
        { name: "🔐 Passcord", value: `[Coffre à mots de passe](https://pass.cordsuite.app)\nBot : ${mention("Passbot")} • En préparation`, inline: true },
        { name: "📝 Notecord", value: `[Notes synchronisées](https://note.cordsuite.app)\nBot : ${mention("Notebot")} • En préparation`, inline: true },
        { name: "🔗 Linkcord", value: `[Liens et page personnelle](https://link.cordsuite.app)\nBot : ${mention("Linkbot")} • En préparation`, inline: true },
        { name: "🍱 Bentocord", value: `[Profil visuel façon bento](https://bento.cordsuite.app)\nBot : ${mention("Bentobot")} • En préparation`, inline: true },
        { name: "➡️ Gocord", value: `[Liens courts faciles à retenir](https://go.cordsuite.app)\nBot : ${mention("Gobot")} • En préparation`, inline: true },
        { name: "🎯 Quizcord", value: `[Quiz et blind tests](https://quiz.cordsuite.app)\nBot : ${mention("Quizbot")} • En préparation`, inline: true },
        { name: "💰 Budgetcord", value: `[Gestion de budget personnel](https://budget.cordsuite.app)\nBot : ${mention("Budgetbot")} • En préparation`, inline: true },
      ],
      footer: footer("catalogue des outils"),
    },
  },
  {
    channelId: channels.links,
    key: "liens officiels",
    embed: {
      title: "Liens officiels 🌐",
      description: "Les accès utiles à Cordsuite sont réunis ici. Vérifie toujours le domaine avant de saisir des informations sensibles.",
      color: BLUE,
      fields: [
        { name: "Cordsuite", value: "[cordsuite.app](https://cordsuite.app)", inline: true },
        { name: "Drivecord", value: "[drivecord.app](https://drivecord.app)", inline: true },
        { name: "Tunecord", value: "[tunecord.vercel.app](https://tunecord.vercel.app)", inline: true },
        { name: "GitHub", value: "[LeVraiLunatix](https://github.com/LeVraiLunatix)", inline: true },
      ],
      footer: footer("liens officiels"),
    },
  },
  {
    channelId: channels.documentation,
    key: "documentation",
    embed: {
      title: "Documentation Cordsuite 📖",
      description: "Retrouve les guides utiles pour comprendre les outils et résoudre les problèmes les plus courants.",
      color: BLUE,
      fields: [
        { name: "Documentation Drivecord", value: "[Ouvrir les guides](https://drivecord.app/docs)", inline: true },
        { name: "Découvrir les outils", value: `Consulte <#${channels.tools}> pour choisir le bon service et son bot.`, inline: true },
        { name: "Besoin d’aide ?", value: "Passe par le salon support en décrivant l’outil, le problème et les étapes déjà essayées.", inline: false },
      ],
      footer: footer("documentation"),
    },
  },
  {
    channelId: channels.faq,
    key: "faq",
    embed: {
      title: "Questions fréquentes ❓",
      description: "Les réponses rapides aux questions les plus courantes sur la suite.",
      color: PURPLE,
      fields: [
        { name: "Quel bot dois-je utiliser ?", value: `Commence avec ${mention("CordBot")}, le bot principal. Chaque outil et son bot sont présentés dans <#${channels.tools}>.` },
        { name: "Où suivre les nouveautés ?", value: "Les annonces et mises à jour officielles sont publiées dans la catégorie dédiée à la suite." },
        { name: "Un outil ne fonctionne pas ?", value: "Consulte d’abord la documentation, puis ouvre une demande dans le salon support avec le plus de détails possible." },
        { name: "Comment accéder au serveur ?", value: `Lis <#${channels.rules}> puis utilise le bouton dans <#${channels.verification}>.` },
      ],
      footer: footer("faq"),
    },
  },
  {
    channelId: channels.verification,
    key: "vérification",
    embed: {
      title: "Accéder à la communauté ✅",
      description: `Lis d’abord <#${channels.rules}>, puis clique sur **Se vérifier**. Recopie le code affiché : CordBot t’attribuera automatiquement le rôle de membre vérifié.`,
      color: 0x57f287,
      fields: [
        { name: "Pourquoi cette étape ?", value: "Elle limite les comptes automatisés et protège les échanges de la communauté." },
      ],
      footer: footer("vérification"),
    },
    components: [
      {
        type: 1,
        components: [{ type: 2, style: 3, custom_id: "verify:start", label: "Se vérifier", emoji: { name: "✅" } }],
      },
    ],
  },
];

async function upsertPublication(publication) {
  const marker = `Cordsuite • ${publication.key}`;
  const messages = await rest.get(Routes.channelMessages(publication.channelId), {
    query: new URLSearchParams({ limit: "100" }),
  });
  const existing = messages.find(
    (message) => message.author?.id === cordBot.id && message.embeds?.some((embed) => embed.footer?.text === marker),
  );
  const body = {
    embeds: publication.embeds || [publication.embed],
    components: publication.components || [],
    allowed_mentions: { parse: [] },
  };
  const message = existing
    ? await rest.patch(Routes.channelMessage(publication.channelId, existing.id), { body })
    : await rest.post(Routes.channelMessages(publication.channelId), { body });
  return {
    action: existing ? "mis à jour" : "publié",
    key: publication.key,
    url: `https://discord.com/channels/${guildId}/${publication.channelId}/${message.id}`,
  };
}

const results = [];
for (const publication of publications) results.push(await upsertPublication(publication));
console.log(JSON.stringify({ sender: "CordBot", publications: results }, null, 2));
