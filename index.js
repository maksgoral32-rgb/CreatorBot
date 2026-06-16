require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`✅ CreatorBot is online as ${client.user.tag}`);

  const statuses = [
    "helping Roblox creators",
    "building with !creator",
    "Roblox scripts & stores",
    "your Discord server grow",
  ];

  let statusIndex = 0;

  client.user.setActivity(statuses[statusIndex], { type: 3 });

  setInterval(() => {
    statusIndex = (statusIndex + 1) % statuses.length;
    client.user.setActivity(statuses[statusIndex], { type: 3 });
  }, 30000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith("!creator")) return;

  message.reply("I'm CreatorBot! I help Roblox creators. For now, I'm learning. Ask me anything about Roblox scripting, stores, or Discord servers!");
});

client.login(process.env.DISCORD_TOKEN);
