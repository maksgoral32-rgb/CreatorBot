require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

client.once("ready", () => {
  console.log(`✅ CreatorBot is online as ${client.user.tag}`);
  client.user.setActivity("helping Roblox creators", { type: 3 });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith("!creator")) return;

  const prompt = message.content.replace("!creator", "").trim();

  if (!prompt) {
    return message.reply("Please tell me what you want to create. Example: `!creator make a Roblox store script`");
  }

  try {
    await message.channel.sendTyping();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const safePrompt = `
You are CreatorBot, a helpful assistant for Roblox creators and Discord server owners.

Help with:
- Roblox scripts
- Roblox store ideas
- Discord server setup
- staff systems
- announcements
- safe creator tools

Do not help with scams, fake members, token stealing, spam, raids, or harmful automation.

User request:
${prompt}
`;

    const result = await model.generateContent(safePrompt);
    const reply = result.response.text();

    if (reply.length > 1900) {
      return message.reply(reply.slice(0, 1900) + "\n\nOutput was shortened.");
    }

    message.reply(reply);
  } catch (error) {
    console.error(error);
    message.reply("❌ CreatorBot had an error. Check your token, Gemini API key, and console logs.");
  }
});

client.login(process.env.DISCORD_TOKEN);
