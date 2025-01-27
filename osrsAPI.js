const axios = require("axios");
const { SKILLS, SKILLS_AND_ACTIVITIES } = require("./constants");

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
    if (!osrsName || !gameMode) {
      throw new Error("OSRS name or game mode is missing.");
    }

    const url = await getUrl(osrsName, gameMode);

    if (!url) {
      throw new Error(`Failed to retrieve URL for ${osrsName} (${gameMode}).`);
    }

    const response = await axios.get(url);

    if (!response || !response.data) {
      throw new Error(`Unable to fetch stats for player: ${osrsName}`);
    }

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
  } catch (err) {
    console.error("Error in fetchAndDisplayStats:", err);
    throw new Error(`There was an error fetching stats: ${err.message}`);
  }
}

async function fetchSkillLevel(osrsName, gameMode, skill) {
  try {
    // Generate the API URL
    const url = await getUrl(osrsName, gameMode);
    console.log(`Generated URL: ${url}`);

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

async function fetchActivityData(osrsName, gameMode, activity) {
  try {
    const url = await getUrl(osrsName, gameMode);

    const response = await axios.get(url);

    if (!response || !response.data) {
      throw new Error(`No response received from API for ${osrsName}`);
    }

    const playerData = response.data.split("\n");
    const activityIndex = SKILLS_AND_ACTIVITIES.indexOf(activity);

    if (activityIndex === -1) {
      throw new Error(`Activity ${activity} is not recognized.`);
    }

    const activityData = playerData[activityIndex];

    if (!activityData || activityData.includes("-1")) {
      return `${activity}: No data available.`;
    }

    const [rank, kills] = activityData.split(",");
    return `${osrsName} ${activity}:\n**Rank:** ${rank}\n**Kills:** ${kills}`;
  } catch (err) {
    console.log("Error in fetchKCForActivity.", err.message);
    throw new Error(
      `There was an error fetching kill count data: ${err.message}`
    );
  }
}

module.exports = {
  getUrl,
  fetchAndDisplayStats,
  fetchSkillLevel,
  fetchActivityData,
};
