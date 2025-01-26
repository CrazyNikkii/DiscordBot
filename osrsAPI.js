const axios = require("axios");
const { SKILLS } = require("./constants");

const BASE_URL = "https://secure.runescape.com/m=hiscore_oldschool";
const GAME_MODE_PATHS = {
  Ironman: "_ironman",
  "Hardcore Ironman": "_hardcore_ironman",
  "Ultimate Ironman": "_ultimate",
};

async function getUrl(osrsName, gameMode) {
  // Ensure that osrsName is a valid player name
  if (!osrsName || osrsName === "") {
    throw new Error("Player name is required.");
  }

  const gameModePath = GAME_MODE_PATHS[gameMode] || "";

  const url = new URL(`${BASE_URL}${gameModePath}/index_lite.ws`);
  url.searchParams.append("player", osrsName);

  return url.toString();
}

async function fetchAndDisplayStats(osrsName, gameMode) {
  try {
    const url = await getUrl(osrsName, gameMode);
    const response = await axios.get(url);

    if (response && response.data) {
      const playerData = response.data.split("\n");
      const stats = SKILLS.map((skill, index) => {
        const skillData = playerData[index];
        if (skillData && skillData !== "") {
          const [rank, level, exp] = skillData.split(",");
          return `${skill}: Level: ${level}, Exp: ${exp}`;
        }

        return `${skill}: No data available`;
      }).join("\n");

      return stats;
    } else {
      throw new Error(`Unable to fetch stats for player: ${osrsName}`);
    }
  } catch (err) {
    console.error("Error in fetchAndDisplayStats:", err);
    throw new Error(`There was an error fetching stats: ${err.message}`);
  }
}

async function fetchSkillLevel(osrsName, gameMode, skill) {
  try {
    // Generate the API URL
    const url = await getUrl(osrsName, gameMode);

    // Fetch the API response
    const response = await axios.get(url);
    if (!response || !response.data) {
      throw new Error(`No response received from API for ${osrsName}`);
    }

    // Parse the API response
    const playerData = response.data.split("\n");

    // Get the skill index and corresponding data
    const skillIndex = SKILLS.indexOf(skill.toLowerCase());
    if (skillIndex === -1) {
      throw new Error(`Skill '${skill}' is not recognized.`);
    }

    const skillData = playerData[skillIndex];

    // Handle missing or incomplete skill data
    if (
      !skillData ||
      skillData.split(",").length < 3 ||
      skillData.includes("-1")
    ) {
      return `Skill data for **${skill}** is not available or incomplete for **${osrsName}**.`;
    }

    // Parse the skill data (rank, level, experience)
    const [rank, level, exp] = skillData.split(",");
    return `**${osrsName} ${skill}**:\n**Level:** ${level}\n**Exp:** ${exp}`;
  } catch (err) {
    console.error("Error in fetchSkillLevel:", err.message);
    throw new Error(`There was an error fetching skill data: ${err.message}`);
  }
}

module.exports = { getUrl, fetchAndDisplayStats, fetchSkillLevel };
