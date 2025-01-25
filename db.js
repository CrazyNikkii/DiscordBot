const { Pool } = require("pg");

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Get game mode by OSRS name
async function getGameModeByOSRSName(osrsName) {
  try {
    const res = await pool.query(
      "SELECT gameMode FROM users WHERE LOWER(osrs_name) = LOWER($1)",
      [osrsName]
    );

    const gameMode = res.rows.length > 0 ? res.rows[0].gamemode : null;

    return gameMode;
  } catch (err) {
    console.error("Error querying game mode:", err);
    return null;
  }
}

// Get all registered users
async function getAllUsers() {
  const res = await pool.query("SELECT osrs_name, discord_id FROM users");
  return res.rows;
}

// Add player to the database
async function addPlayerToDB(discordId, username, osrsName, gameMode) {
  try {
    await pool.query(
      `INSERT INTO users (discord_id, username, osrs_name, gameMode) 
       VALUES ($1, $2, $3, $4)`,
      [discordId, username, osrsName, gameMode]
    );
  } catch (err) {
    throw err;
  }
}

// Remove player from the database
async function removePlayerFromDB(discordId, osrsName) {
  try {
    await pool.query(
      "DELETE FROM users WHERE discord_id = $1 AND osrs_name = $2",
      [discordId, osrsName]
    );
  } catch (err) {
    throw err;
  }
}

// Get user info by Discord ID
async function getUserInfoByDiscordId(discordId) {
  const res = await pool.query(
    "SELECT osrs_name, gamemode FROM users WHERE discord_id = $1",
    [discordId]
  );
  return res.rows;
}

// Get all users by Discord ID
async function getAllUsersByDiscordId(discordId) {
  const res = await pool.query(
    "SELECT osrs_name FROM users WHERE discord_id = $1",
    [discordId]
  );
  return res.rows;
}

module.exports = {
  getGameModeByOSRSName,
  getAllUsers,
  addPlayerToDB,
  removePlayerFromDB,
  getUserInfoByDiscordId,
  getAllUsersByDiscordId,
};
