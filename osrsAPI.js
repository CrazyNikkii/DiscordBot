const axios = require("axios");
const { SKILLS } = require("./constants");

const BASE_URL = "https://secure.runescape.com/m=hiscore_oldschool";
const GAME_MODE_PATHS = {
  Ironman: "_ironman",
  "Hardcore Ironman": "_hardcore_ironman",
  "Ultimate Ironman": "_ultimate",
};

async function getUrl(osrsName, gameMode) {
  console.log("Generating URL for", osrsName, "with gameMode", gameMode); // Log inputs

  // Ensure that osrsName is a valid player name (i.e., no leading "!" from command)
  if (!osrsName || osrsName === "") {
    throw new Error("Player name is required.");
  }

  const gameModePath = GAME_MODE_PATHS[gameMode] || "";
  console.log("GameMode Path:", gameModePath); // Log the path

  const url = new URL(`${BASE_URL}${gameModePath}/index_lite.ws`);
  url.searchParams.append("player", osrsName); // Make sure osrsName is correctly passed here
  console.log("Final URL:", url.toString()); // Log the final URL

  return url.toString();
}

async function fetchAndDisplayStats(osrsName, gameMode) {
  try {
    const url = await getUrl(osrsName, gameMode);
    console.log("URL:", url);
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

      console.log(stats); // Log the stats for debugging
      return stats; // Return the stats here so we can use it later
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
    const url = await getUrl(osrsName, gameMode); // Use the getUrl function to generate the URL
    const response = await axios.get(url);

    if (response && response.data) {
      const playerData = response.data.split("\n");
      const skillIndex = SKILLS.indexOf(skill);

      if (skillIndex === -1) {
        throw new Error(`Skill **${skill}** not recognized.`);
      }

      const skillData = playerData[skillIndex];
      if (skillData && skillData !== "") {
        const [rank, level, exp] = skillData.split(",");
        return `**${osrsName}: ${skill}: Level: ${level}**`;
      } else {
        throw new Error(`${skill} skill data not available for ${osrsName}`);
      }
    } else {
      throw new Error(`Unable to fetch data for ${osrsName}`);
    }
  } catch (err) {
    throw new Error(`There was an error fetching skill data: ${err.message}`);
  }
}

module.exports = { getUrl, fetchAndDisplayStats, fetchSkillLevel };
