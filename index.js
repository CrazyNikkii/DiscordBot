// Load variables .env
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  getGameModeByOSRSName,
  getAllUsers,
  addPlayerToDB,
  removePlayerFromDB,
  getUserInfoByDiscordId,
  getAllUsersByDiscordId,
} = require("./db");

const {
  CUSTOM_EMOJIS,
  SKILLS_AND_ACTIVITIES,
  ALIAS_MAP,
} = require("./constants");

const {
  fetchAndDisplayStats,
  fetchSkillLevel,
  fetchActivityData,
} = require("./osrsAPI");

console.log(fetchAndDisplayStats);

const PREFIX = "!";

// Create a Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
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
  return collected.first()?.content;
}

async function askGameMode(message) {
  const gameModeMessage = await message.reply(
    "Please select the gamemode by reacting:\n" +
      `${CUSTOM_EMOJIS.RegEmoji} Regular\n` +
      `${CUSTOM_EMOJIS.IMEmoji} Ironman\n` +
      `${CUSTOM_EMOJIS.HCEmoji} Hardcore Ironman\n` +
      `${CUSTOM_EMOJIS.UIMEmoji} Ultimate Ironman\n` +
      `${CUSTOM_EMOJIS.CancelEmoji} Cancel`
  );

  // React to the message with all game mode emojis
  await gameModeMessage.react(CUSTOM_EMOJIS.RegEmoji);
  await gameModeMessage.react(CUSTOM_EMOJIS.IMEmoji);
  await gameModeMessage.react(CUSTOM_EMOJIS.HCEmoji);
  await gameModeMessage.react(CUSTOM_EMOJIS.UIMEmoji);
  await gameModeMessage.react(CUSTOM_EMOJIS.CancelEmoji);

  // Create a reaction collector to listen for the reactions
  const filter = (reaction, user) => user.id === message.author.id;
  const collector = gameModeMessage.createReactionCollector({
    filter,
    time: 60000,
  });

  return new Promise((resolve) => {
    collector.on("collect", (reaction) => {
      console.log(`Reaction collected: ${reaction.emoji.id}`); // Log the emoji ID for debugging
      const selectedEmoji = reaction.emoji.id; // Use the emoji ID

      let gameMode;

      switch (selectedEmoji) {
        case "1331210130481483847": // ID for RegEmoji
          gameMode = "Regular";
          break;
        case "1331208060760494153": // ID for IMEmoji
          gameMode = "Ironman";
          break;
        case "1331208059678101534": // ID for HCEmoji
          gameMode = "Hardcore Ironman";
          break;
        case "1331208063079940126": // ID for UIMEmoji
          gameMode = "Ultimate Ironman";
          break;
        case "❌": // Cancel emoji
          resolve(null); // Resolve with null if canceled
          break;
        default:
          resolve(null); // Invalid emoji, resolve with null
          break;
      }

      // Stop the collector as we've received a valid response
      collector.stop();

      // Send a message with the selected game mode
      if (gameMode) {
        message.reply(`Selected gamemode: **${gameMode}**`);
        resolve(gameMode); // Resolve with the selected game mode
      } else {
        message.reply("Account creation canceled.");
        resolve(null); // Resolve with null for cancellation
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        message.reply("You took too long to select a game mode.");
        resolve(null); // Resolve with null if the time expires
      }
    });
  });
}

function normalizeSkillOrActivity(input) {
  const normalizedInput = input.toLowerCase();
  if (ALIAS_MAP[normalizedInput]) {
    return ALIAS_MAP[normalizedInput];
  }
  if (SKILLS_AND_ACTIVITIES.includes(normalizedInput)) {
    return normalizedInput;
  }
  return null;
}

async function addPlayer(message) {
  const args = message.content.split(/\s+/);
  const osrsName =
    args[1] ||
    (await askQuestions(
      message,
      "What is your Old School RuneScape username?"
    ));

  const gameMode = await askGameMode(message);

  if (gameMode === null) {
    return message.reply("Account creation canceled.");
  }

  // Save to database
  try {
    await addPlayerToDB(
      message.author.id,
      message.author.username,
      osrsName,
      gameMode
    );
    message.reply(`Succesfully added user: **${osrsName}** - **${gameMode}**`);
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
    const userInfo = await getUserInfoByDiscordId(message.author.id);

    if (userInfo.length === 0) {
      return message.reply("You have no registered OSRS accounts.");
    }

    const accounts = userInfo
      .map((row) => `Name: ${row.osrs_name}, Type: ${row.gamemode}`)
      .join("\n");
    message.reply(`Your OSRS accounts:\n${accounts}`);
  } catch (err) {
    console.error(err);
    message.reply("There was an error fetching your data");
  }
}

async function removePlayer(message) {
  try {
    const accounts = await getAllUsersByDiscordId(message.author.id);

    if (accounts.length === 0) {
      return message.reply("You dont have any registered OSRS accounts.");
    }

    const accountList = accounts
      .map((account, index) => `${index + 1}. ${account.osrs_name}`)
      .join("\n");

    message.reply(
      `Here are all your registered accounts:\n${accountList}\nWhich account do you wish to remove?`
    );
    const accountChoice = await askQuestions(
      message,
      `Select account: 1-${accounts.length}`
    );
    const selectedAccount = accounts[parseInt(accountChoice) - 1]?.osrs_name;

    if (!selectedAccount) {
      return message.reply("Invalid selection.");
    }

    await removePlayerFromDB(message.author.id, selectedAccount);
    message.reply(`Successfully removed account: **${selectedAccount}**`);
  } catch (err) {
    console.error(err);
    message.reply("There was an error removing your account.");
  }
}

async function levelCommand(message, args) {
  // Check if there are any arguments
  if (!args || args.length === 0) {
    // No arguments provided: prompt user for selection
    await userLevelSelection(message);
    return;
  }

  const input = args[0]?.toLowerCase(); // First argument (could be a skill or username)
  const osrsName = args[1] || args[0]; // Second argument (username) or fallback to first argument
  const skill = normalizeSkillOrActivity(input); // Normalize skill/activity input

  // If only one argument is provided
  if (args.length === 1) {
    if (SKILLS_AND_ACTIVITIES.map((s) => s.toLowerCase()).includes(skill)) {
      // Argument is a skill: ask user to select an account
      await userLevelSelection(message, skill);
    } else {
      // Argument is likely a username: fetch stats for that username
      await fetchAndDisplayStatsReply(message, osrsName);
    }
  }
  // If both skill and username are provided
  else if (args.length === 2) {
    if (SKILLS_AND_ACTIVITIES.map((s) => s.toLowerCase()).includes(skill)) {
      // Valid skill and username provided: fetch skill level
      await fetchSkillLevelReply(message, osrsName, skill);
    } else {
      // Invalid skill input
      message.reply(
        `"${input}" is not a valid skill. Please check your input.`
      );
    }
  }
  // Invalid input case
  else {
    message.reply(`Invalid command. Please use one of the following formats:
      !lvl
      !lvl <skill>
      !lvl <skill> <osrsname>
      !lvl <osrsname>`);
  }
}

async function kcCommand(message, args) {
  // Ensure there are exactly two arguments: activity (boss) and username
  if (args.length !== 2) {
    message.reply(`Invalid command. Please use the following format:
      !kc <activity> <osrsname>`);
    return;
  }

  let activity = args[0].toLowerCase();
  let osrsName = args[1];

  const normalizedActivity = normalizeSkillOrActivity(activity);
  if (!normalizedActivity) {
    return message.reply(`Invalid activity: ${activity}`);
  }
  console.log(`Received activity: ${activity}`);

  try {
    const gameMode = await getGameModeByOSRSName(osrsName);
    if (!gameMode) {
      return message.reply(`No account found for name ${osrsName}.`);
    }

    const kcData = await fetchActivityData(
      osrsName,
      gameMode,
      normalizedActivity
    );
    message.reply(kcData);
  } catch (err) {
    console.error("Error fetching kill count:", err);
    message.reply(
      `There was an error fetching kill count data: ${err.message}`
    );
  }
}

async function userLevelSelection(message, skill = null) {
  try {
    const res = await getAllUsers();

    if (res.length === 0) {
      return message.reply("You don't have any registered accounts yet.");
    }

    // If only one account, just fetch data for that account
    if (res.length === 1) {
      const osrsName = res[0].osrs_name;
      const gameMode = await getGameModeByOSRSName(osrsName);
      return skill
        ? await fetchSkillLevel(message, osrsName, skill)
        : message.reply(
            `Stats for ${osrsName} (${gameMode} mode):\n${await fetchAndDisplayStats(
              osrsName,
              gameMode
            )}`
          );
    }

    // If multiple accounts, prompt for selection
    const accounts = res
      .map((row, index) => `${index + 1}. ${row.osrs_name}`)
      .join("\n");
    message.reply(`Accounts:\n${accounts}`);

    // Ask for account selection
    const accountChoice = await askQuestions(message, "Select account:");
    const selectedAccountIndex = parseInt(accountChoice) - 1;

    const selectedAccount = res[selectedAccountIndex]?.osrs_name;
    console.log(`User selected account: ${selectedAccount}`);
    if (!selectedAccount) {
      return message.reply("Invalid account selection.");
    }

    // Fetch game mode for the selected account
    const gameMode = await getGameModeByOSRSName(selectedAccount);
    if (!gameMode) {
      return message.reply(
        "Unable to retrieve game mode for selected account."
      );
    }

    if (skill) {
      try {
        const skillLevel = await fetchSkillLevel(
          selectedAccount,
          gameMode,
          skill
        );
        return message.reply(skillLevel);
      } catch (err) {
        console.error("Error fetching skill level:", err);
        return message.reply(
          `There was an error fetching the skill level for **${selectedAccount}**: ${err.message}`
        );
      }
    } else {
      try {
        const stats = await fetchAndDisplayStats(selectedAccount, gameMode);
        return message.reply(
          `Stats for ${selectedAccount} (${gameMode} mode):\n${stats}`
        );
      } catch (err) {
        console.error("Error fetching stats:", err);
        return message.reply(
          `There was an error fetching stats for **${selectedAccount}**: ${err.message}`
        );
      }
    }
  } catch (err) {
    console.error(err);
    message.reply("There was an error fetching your OSRS name.");
  }
}

async function fetchAndDisplayStatsReply(message, osrsName) {
  try {
    const gameMode = await getGameModeByOSRSName(osrsName);
    if (!gameMode) {
      return message.reply(`No account found for name ${osrsName}.`);
    }

    const stats = await fetchAndDisplayStats(osrsName, gameMode);
    message.reply(`**${osrsName} stats:**\n${stats}`);
  } catch (err) {
    console.error(err);
    message.reply(err.message);
  }
}

async function fetchSkillLevelReply(message, osrsName, skill) {
  try {
    const gameMode = await getGameModeByOSRSName(osrsName);
    if (!gameMode) {
      return message.reply(`No account found for name ${osrsName}.`);
    }

    const skillLevel = await fetchSkillLevel(osrsName, gameMode, skill);
    message.reply(skillLevel);
  } catch (err) {
    console.error(err);
    message.reply(err.message);
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
  if (command === "kc") await kcCommand(message, args);
});

// Logging in
client.login(process.env.BOT_TOKEN);
