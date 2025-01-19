// Load variables .env
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { Pool } = require("pg");

const PREFIX = "!";

// Create a Discord client
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

  const command = message.content
    .slice(PREFIX.length)
    .trim()
    .split(" ")[0]
    .toLowerCase();

  if (command === "addplayer") {
    const filter = (response) => response.author.id === message.author.id;

    message.reply("What is your Old School RuneScape username?").then(() => {
      message.channel
        .awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
        .then(async (collected) => {
          const osrsName = collected.first().content;

          message
            .reply(
              "What is your account type? (Regular, Ironman, Hardcore Ironman, Ultimate Ironman"
            )
            .then(() => {
              message.channel
                .awaitMessages({
                  filter,
                  max: 1,
                  time: 60000,
                  errors: ["time"],
                })
                .then(async (collected2) => {
                  const gameMode = collected2.first().content;

                  const validGameModes = [
                    "Regular",
                    "Ironman",
                    "Hardcore Ironman",
                    "Ultimate Ironman",
                  ];
                  if (!validGameModes.includes(gameMode)) {
                    return message.reply(
                      "Invalid gamemode. Please try again with one of: Regular, Ironman, Hardcore Ironman, Ultimate Ironman"
                    );
                  }
                });
            });
        });
    });
  }
});

client.login(process.env.BOT_TOKEN);
