// Load variables .env
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { Pool } = require("pg");

const PREFIX = "!";

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.once("ready", () => {
  console.log(`${client.user.tag} logged in`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(PREFIX)) return;
});

client.login(process.env.BOT_TOKEN);
