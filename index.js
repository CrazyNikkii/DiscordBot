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

// Check if message was sent by bot and if prefix was used
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(PREFIX)) return;

  // Removing the prefix from command and take the command word
  const command = message.content
    .slice(PREFIX.length)
    .trim()
    .split(" ")[0]
    .toLowerCase();

  // COMMAND: Addplayer
  if (command === "addplayer") {
    const filter = (response) => response.author.id === message.author.id;

    // Ask username
    message.reply("What is your Old School RuneScape username?").then(() => {
      message.channel
        .awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
        .then(async (collected) => {
          const osrsName = collected.first().content;

          // Ask type
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

                  // Checking that user chooses correct type
                  if (!validGameModes.includes(gameMode)) {
                    return message.reply(
                      "Invalid gamemode. Please try again with one of: Regular, Ironman, Hardcore Ironman, Ultimate Ironman"
                    );
                  }

                  // Save to database
                  try {
                    await pool.query(
                      `INSERT INTO users (discord_id, username, osrs_name, gameMode) 
                       VALUES ($1, $2, $3, $4)`,
                      [
                        message.author.id,
                        message.author.username,
                        osrsName,
                        gameMode,
                      ]
                    );
                    message.reply(
                      `Succesfully added user: **${osrsName}**, **${gameMode}`
                    );
                  } catch (err) {
                    if (err.code === "23505") {
                      message.reply(`Error: Account already registered`);
                    } else {
                      console.error(err);
                      message.reply(
                        "There was an error saving your information"
                      );
                    }
                  }

                  //Error for waiting too long
                })
                .catch(() => {
                  message.reply("Error: Timeout: Account Type");
                });
            });
        })
        .catch(() => {
          message.reply("Error: Timeout: Account Name");
        });
    });
  }

  // COMMAND: View user info
  if (command === "userinfo") {
    try {
      const res = await pool.query(
        "SELECT osrs_name, gamemode FROM users WHERE discord_id = $1",
        [message.author.id]
      );
      if (res.rows.length > 0) {
        const accounts = res.rows
          .map((row) => `Name: ${row.osrs_name}, Type: ${row.gamemode}`)
          .join("\n");
        message.reply(`Your OSRS accounts:\n${accounts}`);
      } else {
        message.reply("You have no registered OSRS accounts.");
      }
    } catch (err) {
      console.error(err);
      message.reply("There was an error fetching your data");
    }
  }
});

// Logging in
client.login(process.env.BOT_TOKEN);
