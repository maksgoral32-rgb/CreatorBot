require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.GuildMember]
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

// Welcome DM on new member join
client.on("guildMemberAdd", async (member) => {
  try {
    await member.send(
      "Welcome to the server! I'm CreatorBot, here to help Roblox creators. " +
      "Feel free to ask me anything about Roblox scripting, stores, or Discord server management!"
    );
    console.log(`✉️  Welcome DM sent to ${member.user.tag}`);
  } catch (err) {
    console.warn(`⚠️  Could not send welcome DM to ${member.user.tag}: ${err.message}`);
  }
});

// Keyword auto-responses
const keywordReplies = [
  { keyword: "help",    reply: "I'm here to help! Ask me about Roblox scripting, stores, or Discord servers!" },
  { keyword: "roblox",  reply: "Roblox is awesome! Need help with scripts or stores?" },
  { keyword: "script",  reply: "Scripts are my specialty! What kind of Roblox script do you need?" },
  { keyword: "store",   reply: "Building a Roblox store? I can help with that!" },
  { keyword: "discord", reply: "Discord server management? I've got tips for that!" },
];

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const lowerContent = message.content.toLowerCase();

  // Check for keyword matches before command handling
  for (const { keyword, reply } of keywordReplies) {
    if (lowerContent.includes(keyword)) {
      message.reply(reply);
      return;
    }
  }

  // !creator command fallback
  if (!message.content.startsWith("!creator")) return;

  message.reply("I'm CreatorBot! I help Roblox creators. For now, I'm learning. Ask me anything about Roblox scripting, stores, or Discord servers!");
});

client.login(process.env.DISCORD_TOKEN);
