// Load variables .env
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { Pool } = require("pg");
const axios = require("axios");

const PREFIX = "!";

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

async function askQuestions(message, prompt, timeout = 60000) {
  await message.reply(prompt);
  const filter = (response) => response.author.id === message.author.id;
  const collected = await message.channel.awaitMessages({
    filter,
    max: 1,
    time: timeout,
    errors: ["time"],
  });
  return collected.first() ? collected.first().content : null;
}

async function getUrl(osrsName, gameMode) {
  const baseUrl = "https://secure.runescape.com/m=hiscore_oldschool";
  const gameModeUrls = {
    Ironman: `${baseUrl}_ironman/index_lite.ws?player=${osrsName}`,
    "Hardcore Ironman": `${baseUrl}_hardcore_ironman/index_lite.ws?player=${osrsName}`,
    "Ultimate Ironman": `${baseUrl}_ultimate/index_lite.ws?player=${osrsName}`,
  };
  return (
    gameModeUrls[gameMode] || `${baseUrl}/index_lite.ws?player=${osrsName}`
  );
}

async function fetchAndDisplayStats(message, osrsName) {
  try {
    const res = await pool.query(
      "SELECT gameMode FROM users WHERE LOWER(osrs_name) = LOWER($1)",
      [osrsName]
    );

    if (res.rows.length === 0) {
      return message.reply(`No account found for name ${osrsName}.`);
    }

    const gameMode = res.rows[0].gameMode;
    const url = await getUrl(osrsName, gameMode);
    const response = await axios.get(url);

    if (response && response.data) {
      const playerData = response.data.split("\n");
      const stats = skills
        .map((skill, index) => {
          const skillData = playerData[index];
          if (skillData && skillData !== "") {
            const [rank, level, exp] = skillData.split(",");
            return `${skill}: Level: ${level}, Exp: ${exp}`;
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

async function fetchSkillLevel(message, osrsName, skill) {
  try {
    const res = await pool.query(
      "SELECT gamemode FROM users WHERE LOWER(osrs_name) = LOWER($1)",
      [osrsName]
    );

    if (res.rows.length === 0) {
      return message.reply(`No account found for name **${osrsName}**`);
    }

    const gameMode = res.rows[0].gameMode;
    const url = await getUrl(osrsName, gameMode);
    const response = await axios.get(url);

    if (response && response.data) {
      const playerData = response.data.split("\n");

      const skillIndex = skills.indexOf(
        skill.charAt(0).toUpperCase() + skill.slice(1)
      );

      if (skillIndex === -1) {
        return message.reply(`Skill **${skill}** not recognized.`);
      }

      const skillData = playerData[skillIndex];
      if (skillData && skillData !== "") {
        const [rank, level, exp] = skillData.split(",");
        message.reply(`**${osrsName}: ${skill}: Level: ${level}**`);
      } else {
        message.reply(`${skill} skill data not avaible for ${osrsName}`);
      }
    } else {
      message.reply(`Unable to fetch data for ${osrsName}`);
    }
  } catch (err) {
    console.error(err);
    message.reply("There was an error fetching skill data");
  }
}

async function addPlayer(message) {
  const osrsName = await askQuestions(
    message,
    "What is your Old School RuneScape username?"
  );
  const gameMode = await askQuestions(
    message,
    "What is your account type? (Regular, Ironman, Hardcore Ironman, Ultimate Ironman)"
  );

  const validGameModes = [
    "Regular",
    "Ironman",
    "Hardcore Ironman",
    "Ultimate Ironman",
  ];
  if (!validGameModes.includes(gameMode)) {
    return message.reply(
      "Invalid gamemode. Please try again with valid account type."
    );
  }

  // Save to database
  try {
    await pool.query(
      `INSERT INTO users (discord_id, username, osrs_name, gameMode) 
       VALUES ($1, $2, $3, $4)`,
      [message.author.id, message.author.username, osrsName, gameMode]
    );
    message.reply(`Succesfully added user: **${osrsName}**, **${gameMode}`);
  } catch (err) {
    if (err.code === "23505") {
      message.reply(`Error: Account already registered`);
    } else {
      console.error(err);
      message.reply("There was an error saving your information");
    }
  }
}

async function userInfo(message) {
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

async function removePlayer(message) {
  try {
    const res = await pool.query(
      "SELECT osrs_name FROM users WHERE discord_id = $1",
      [message.author.id]
    );

    if (res.rows.length === 0) {
      return message.reply("You dont have any registered OSRS accounts.");
    }

    const accountList = res.rows
      .map((row, index) => `${index + 1}. ${row.osrs_name}`)
      .join("\n");

    message.reply(
      `Here are all your registered accounts:\n${accountList}\nWhich account do you wish to remove?`
    );
    const accountChoice = await askQuestions(
      message,
      `Select account: 1-${res.rows.length}`
    );
    const selectedAccount = res.rows[parseInt(accountChoice) - 1]?.osrs_name;

    if (!selectedAccount) {
      return message.reply("Invalid selection.");
    }

    await pool.query(
      "DELETE FROM users WHERE discord_id = $1 AND osrs_name = $2",
      [message.author.id, selectedAccount]
    );
    message.reply(`Successfully removed account: **${selectedAccount}**`);
  } catch (err) {
    console.error(err);
    message.reply("There was an error removing your account.");
  }
}

async function levelCommand(message, args) {
  const skill = args[0]?.toLowerCase();
  const osrsName = args[1] || args[0];
  if (!args.length) {
    await userLevelSelection(message);
  }
  // If the first argument is skill, but no name provided.
  else if (
    skill &&
    !osrsName &&
    skills.map((s) => s.toLocaleLowerCase()).includes(skill)
  ) {
    await userLevelSelection(message, skill);
  }
  // If both skill and name provided.
  else if (
    skill &&
    osrsName &&
    skills.map((s) => s.toLocaleLowerCase()).includes(skill)
  ) {
    await fetchSkillLevel(message, osrsName, skill);
  }
  // If only name is given
  else if (
    osrsName &&
    !skills.map((s) => s.toLocaleLowerCase()).includes(skill)
  ) {
    await fetchAndDisplayStats(message, osrsName);
  } else {
    message.reply(`Invalid command. Please use one of the following formats:
      !lvl
      !lvl <skill>
      !lvl <skill> <osrsname>
      !lvl <osrsname>`);
  }
}

async function userLevelSelection(message, skill = null) {
  try {
    const res = await pool.query("SELECT osrs_name, discord_id FROM users");

    // Show user available accounts
    if (res.rows.length > 0) {
      if (res.rows.length > 1) {
        const accounts = res.rows
          .map((row, index) => `${index + 1}. ${row.osrs_name}`)
          .join("\n");
        message.reply(`Select account:\n${accounts}`);

        // Ask for account selection
        const accountChoice = await askQuestions(message, "Select account:");
        const selectedAccountIndex = parseInt(accountChoice) - 1;

        // Validate selection
        const selectedAccount = res.rows[selectedAccountIndex]?.osrs_name;
        if (!selectedAccount)
          return message.reply("Invalid account selection.");

        // Fetch data for selected account
        if (skill) await fetchSkillLevel(message, selectedAccount, skill);
        else await fetchAndDisplayStats(message, selectedAccount);
      } else {
        // If only one account, just fetch data
        const osrsName = res.rows[0].osrs_name;
        if (skill) await fetchSkillLevel(message, osrsName, skill);
        else await fetchAndDisplayStats(message, osrsName);
      }
    } else {
      message.reply("You don't have any registered accounts yet.");
    }
  } catch (err) {
    console.error(err);
    message.reply("There as an error fetching your OSRS name.");
  }
}

// Check if message was sent by bot and if prefix was used
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  // Removing the prefix from command and take the command word
  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "addplayer") await addPlayer(message);
  if (command === "userinfo") await userInfo(message);
  if (command === "removeplayer") await removePlayer(message);
  if (command === "lvl") await levelCommand(message, args);
});

// Logging in
client.login(process.env.BOT_TOKEN);
