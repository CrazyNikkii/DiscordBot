// Load variables .env
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { Pool } = require("pg");
const axios = require("axios");

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

  // COMMAND: Remove player
  if (command === "removeplayer") {
    try {
      const res = await pool.query(
        "SELECT osrs_name FROM users WHERE discord_id = $1",
        [message.author.id]
      );

      // Checks if user has any registered accounts
      if (res.rows.length === 0) {
        return message.reply("You don't have any registered OSRS accounts");
      }

      // Make a list of accounts
      const accountList = res.rows
        .map((row, index) => `${index + 1}. ${row.osrs_name}`)
        .join("\n");

      message.reply(
        `Here are your registered accounts:\n${accountList}\n\nWhich account you wish to remove?`
      );

      // Filters for the reply (right account + number within the list)
      const filter = (response) =>
        response.author.id === message.author.id &&
        !isNaN(response.content) &&
        parseInt(response.content) > 0 &&
        parseInt(response.content) <= res.rows.length;

      // Waits for answer
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ["time"],
      });

      // Make the selection
      const selectedIndex = parseInt(collected.first().content) - 1;
      const selectedAccount = res.rows[selectedIndex].osrs_name;

      // Removing the selected player
      await pool.query(
        "DELETE FROM users WHERE discord_id = $1 AND osrs_name = $2",
        [message.author.id, selectedAccount]
      );

      message.reply(`Succesfully removed player: **${selectedAccount}**`);

      // Errors
    } catch (err) {
      if (err.name === "CollectionError") {
        message.reply("Error: Timeout");
      } else {
        console.error(err);
        message.reply("There was an error removing your player.");
      }
    }
  }

  // COMMAND: Levels
  if (command === "lvl") {
    const args = message.content.slice(PREFIX.length + 4).trim();
    let givedName = args || null;

    if (!givedName) {
      try {
        const res = await pool.query(
          "SELECT osrs_name FROM users WHERE discord_id = $1",
          [message.author.id]
        );

        if (res.rows.length > 0) {
          if (res.rows.length > 1) {
            const accounts = res.rows
              .map((row, index) => `${index + 1}. ${row.osrs_name}`)
              .join("\n");
            const promptMessage = await message.reply(
              `Select account:\n${accounts}\n`
            );

            const filter = (response) => {
              const choice = parseInt(response.content);
              return (
                response.author.id === message.author.id &&
                choice >= 1 &&
                choice <= res.rows.length
              );
            };

            message.channel
              .awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
              .then(async (collected) => {
                const choice = parseInt(collected.first().content);
                osrsName = res.rows[choice - 1].osrs_name;
                await fetchAndDisplayStats(message, osrsName);
              })
              .catch(() => {
                message.reply("Error: Timeout");
              });
          } else {
            osrsName = res.rows[0].osrs_name;
            await fetchAndDisplayStats(message, osrsName);
          }
        } else {
          message.reply("You dont have any registered accounts yet.");
        }
      } catch (err) {
        console.error(err);
        message.reply("There was an error fetching your OSRS name.");
      }
    } else {
      await fetchAndDisplayStats(message, givedName);
    }
  }
});

async function fetchAndDisplayStats(message, osrsName) {
  try {
    const res = await pool.query(
      "SELECT gameMode FROM users WHERE osrs_name = $1 AND discord_id = $2",
      [osrsName, message.author.id]
    );

    if (res.rows.length === 0) {
      return message.reply(`No account found for name **${osrsName}**.`);
    }

    const gameMode = res.rows[0].gameMode;

    let url;
    if (gameMode === "Ironman") {
      url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${osrsName}`;
    } else if (gameMode === "Hardcore Ironman") {
      url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${osrsName}`;
    } else if (gameMode === "Ultimate Ironman") {
      url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${osrsName}`;
    } else {
      url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${osrsName}`;
    }

    const response = await axios.get(url);

    if (response && response.data) {
      const playerData = response.data.split("\n"); // Split the response by line

      // Skill list
      const skills = [
        "Overall",
        "Attack",
        "Defence",
        "Strength",
        "Hitpoints",
        "Ranged",
        "Prayer",
        "Magic",
        "Cooking",
        "Woodcutting",
        "Fletching",
        "Fishing",
        "Firemaking",
        "Crafting",
        "Smithing",
        "Mining",
        "Herblore",
        "Agility",
        "Thieving",
        "Slayer",
        "Farming",
        "Runecrafting",
        "Hunter",
        "Construction",
      ];

      const stats = skills
        .map((skill, index) => {
          const skillData = playerData[index]; // Get the data from the playerData object
          if (skillData && skillData !== "") {
            const [rank, level, exp] = skillData.split(",");
            return `${skill}: Rank: ${rank}, Level: ${level}, Exp: ${exp}`;
          }

          return `${skill}: No data available`;
        })
        .join("\n");

      message.reply(`**${osrsName} stats: **\n${stats}`);
    } else {
      message.reply(`Unable to fetch stats for player: **${osrsName}**`);
    }
  } catch (err) {
    console.error(err);
    message.reply("There was an error fetching your stats.");
  }
}

// Logging in
client.login(process.env.BOT_TOKEN);
