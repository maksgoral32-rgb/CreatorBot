require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const https = require("https");
const { URL } = require("url");

// ── Webhook logging ──────────────────────────────────────────────────────────

const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1516343246966620262/NP7b8tQqwApYowNbQi3p8JTDIfEO-RusQZOBvHUuWNO6p3lNCk93QrQZZRLSlEBgZuM0";

const COLORS = {
  success: 0x57f287, // green
  info:    0x5865f2, // blue
  warning: 0xfee75c, // yellow
  error:   0xed4245, // red
};

// ── Emoji configuration ───────────────────────────────────────────────────────
// Set EMOJI_* environment variables in Railway to use custom Discord server
// emojis (e.g. "<:success:1234567890>"). Falls back to Unicode if not set.

const EMOJIS = {
  SUCCESS:  process.env.EMOJI_SUCCESS  || "✅",
  ERROR:    process.env.EMOJI_ERROR    || "❌",
  WARNING:  process.env.EMOJI_WARNING  || "⚠️",
  INFO:     process.env.EMOJI_INFO     || "ℹ️",
  WELCOME:  process.env.EMOJI_WELCOME  || "👋",
  DM:       process.env.EMOJI_DM       || "📨",
  ROBOT:    process.env.EMOJI_ROBOT    || "🤖",
  LIGHTNING:process.env.EMOJI_LIGHTNING|| "⚡",
  ONLINE:   process.env.EMOJI_ONLINE   || "🟢",
};

/**
 * Send an embed to the monitoring webhook.
 * @param {string} title       - Embed title (e.g. "✅ CreatorBot Online")
 * @param {string} description - Embed body text
 * @param {"success"|"info"|"warning"|"error"} [type="info"] - Color key
 */
function logToWebhook(title, description, type = "info") {
  try {
    const payload = JSON.stringify({
      embeds: [
        {
          title,
          description,
          color: COLORS[type] ?? COLORS.info,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const url = new URL(WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      // Drain the response so the socket is released cleanly
      res.resume();
    });

    req.on("error", (err) => {
      console.error("[Webhook] Failed to send log:", err.message);
    });

    req.write(payload);
    req.end();
  } catch (err) {
    console.error("[Webhook] Unexpected error:", err.message);
  }
}

// ── Discord client ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ── Ready ────────────────────────────────────────────────────────────────────

client.once("ready", () => {
  console.log(`${EMOJIS.ONLINE} CreatorBot is online as ${client.user.tag}`);

  logToWebhook(
    `${EMOJIS.ONLINE} CreatorBot Online`,
    `**Tag:** ${client.user.tag}\n**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`,
    "success"
  );

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

// ── Member join ──────────────────────────────────────────────────────────────

client.on("guildMemberAdd", async (member) => {
  console.log(`${EMOJIS.WELCOME} New member joined: ${member.user.tag} in ${member.guild.name}`);

  logToWebhook(
    `${EMOJIS.WELCOME} New Member`,
    `**Member:** ${member.user.tag}\n**Server:** ${member.guild.name}`,
    "info"
  );

  // Welcome DM
  try {
    await member.send(
      `Welcome to **${member.guild.name}**, ${member.user.username}! 🎉\nI'm CreatorBot — here to help Roblox creators like you. Type \`!creator\` in any channel to get started!`
    );
    console.log(`${EMOJIS.DM} Welcome DM sent to ${member.user.tag}`);

    logToWebhook(
      `${EMOJIS.DM} Welcome DM Sent`,
      `**Member:** ${member.user.tag}`,
      "success"
    );
  } catch (err) {
    console.error(`${EMOJIS.WARNING} Could not send welcome DM to ${member.user.tag}:`, err.message);

    logToWebhook(
      `${EMOJIS.WARNING} Welcome DM Failed`,
      `**Member:** ${member.user.tag}\n**Reason:** ${err.message}`,
      "warning"
    );
  }
});

// ── Messages ─────────────────────────────────────────────────────────────────

const KEYWORDS = ["roblox", "scripting", "store", "discord server"];

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Keyword auto-responses
  const lowerContent = message.content.toLowerCase();
  for (const keyword of KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      console.log(`${EMOJIS.ROBOT} Auto-response triggered for keyword "${keyword}" by ${message.author.tag}`);

      logToWebhook(
        `${EMOJIS.ROBOT} Auto-Response`,
        `**Keyword matched:** \`${keyword}\`\n**User:** ${message.author.tag}\n**Channel:** <#${message.channel.id}>`,
        "info"
      );
      break; // Only log once per message even if multiple keywords match
    }
  }

  // !creator command
  if (message.content.startsWith("!creator")) {
    console.log(`${EMOJIS.LIGHTNING} !creator command used by ${message.author.tag}: "${message.content}"`);

    logToWebhook(
      `${EMOJIS.LIGHTNING} Creator Command`,
      `**User:** ${message.author.tag}\n**Message:** ${message.content}`,
      "info"
    );

    try {
      await message.reply(
        "I'm CreatorBot! I help Roblox creators. For now, I'm learning. Ask me anything about Roblox scripting, stores, or Discord servers!"
      );
    } catch (err) {
      console.error(`${EMOJIS.ERROR} Failed to reply to !creator from ${message.author.tag}:`, err.message);

      logToWebhook(
        `${EMOJIS.ERROR} Error`,
        `**Event:** !creator reply failed\n**User:** ${message.author.tag}\n**Details:** ${err.message}`,
        "error"
      );
    }

    return;
  }
});

// ── Global error handlers ────────────────────────────────────────────────────

client.on("error", (err) => {
  console.error(`${EMOJIS.ERROR} Client error:`, err.message);

  logToWebhook(
    `${EMOJIS.ERROR} Error`,
    `**Event:** Discord client error\n**Details:** ${err.message}`,
    "error"
  );
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(`${EMOJIS.ERROR} Unhandled rejection:`, message);

  logToWebhook(
    `${EMOJIS.ERROR} Error`,
    `**Event:** Unhandled promise rejection\n**Details:** ${message}`,
    "error"
  );
});

// ── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);

