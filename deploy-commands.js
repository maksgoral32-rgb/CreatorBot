require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  new SlashCommandBuilder()
    .setName("creator")
    .setDescription("Ask CreatorBot to help you build something")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("What do you want to create?")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered successfully.");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
})();
