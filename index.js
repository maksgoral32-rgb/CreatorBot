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
  console.log(`✅ CreatorBot is online as ${client.user.tag}`);

  logToWebhook(
    "✅ CreatorBot Online",
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
  console.log(`👋 New member joined: ${member.user.tag} in ${member.guild.name}`);

  logToWebhook(
    "👋 New Member",
    `**Member:** ${member.user.tag}\n**Server:** ${member.guild.name}`,
    "info"
  );

  // Welcome DM
  try {
    await member.send(
      `Welcome to **${member.guild.name}**, ${member.user.username}! 🎉\nI'm CreatorBot — here to help Roblox creators like you. Type \`!creator\` in any channel to get started!`
    );
    console.log(`📨 Welcome DM sent to ${member.user.tag}`);

    logToWebhook(
      "📨 Welcome DM Sent",
      `**Member:** ${member.user.tag}`,
      "success"
    );
  } catch (err) {
    console.error(`⚠️ Could not send welcome DM to ${member.user.tag}:`, err.message);

    logToWebhook(
      "⚠️ Welcome DM Failed",
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
      console.log(`🤖 Auto-response triggered for keyword "${keyword}" by ${message.author.tag}`);

      logToWebhook(
        "🤖 Auto-Response",
        `**Keyword matched:** \`${keyword}\`\n**User:** ${message.author.tag}\n**Channel:** <#${message.channel.id}>`,
        "info"
      );
      break; // Only log once per message even if multiple keywords match
    }
  }

  // !creator command
  if (message.content.startsWith("!creator")) {
    console.log(`⚡ !creator command used by ${message.author.tag}: "${message.content}"`);

    logToWebhook(
      "⚡ Creator Command",
      `**User:** ${message.author.tag}\n**Message:** ${message.content}`,
      "info"
    );

    try {
      await message.reply(
        "I'm CreatorBot! I help Roblox creators. For now, I'm learning. Ask me anything about Roblox scripting, stores, or Discord servers!"
      );
    } catch (err) {
      console.error(`❌ Failed to reply to !creator from ${message.author.tag}:`, err.message);

      logToWebhook(
        "❌ Error",
        `**Event:** !creator reply failed\n**User:** ${message.author.tag}\n**Details:** ${err.message}`,
        "error"
      );
    }

    return;
  }
});

// ── Global error handlers ────────────────────────────────────────────────────

client.on("error", (err) => {
  console.error("❌ Client error:", err.message);

  logToWebhook(
    "❌ Error",
    `**Event:** Discord client error\n**Details:** ${err.message}`,
    "error"
  );
});

process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error("❌ Unhandled rejection:", message);

  logToWebhook(
    "❌ Error",
    `**Event:** Unhandled promise rejection\n**Details:** ${message}`,
    "error"
  );
});

// ── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);

