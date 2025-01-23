# OSLeaders

OSLeaders is a Discord bot designed to enhance group interactions among friends by integrating Old School RuneScape (OSRS) stats and features into your Discord server. The bot allows users to manage their OSRS accounts, view stats, and access skill-related data directly from the OSRS API. Future updates will include leaderboards and competitive features to make the experience even more engaging.

---

## 🚧 Current Status

At this stage, OSLeaders is not publicly available. It is under active development, and I plan to release it for public use after further improvements and feature additions. Stay tuned for updates!

---

## 🚀 Features

### Current Features

- **Add and Remove Accounts**  
  Easily add or remove your OSRS accounts with commands.
- **View Registered Accounts**  
  Display a list of your registered OSRS accounts, including game modes (e.g., Regular, Ironman).

- **Fetch Player Stats**  
  Retrieve detailed skill levels and experience data for any registered OSRS account.

- **Skill Data**  
  Query specific skill levels and experience points using OSRS's official API.

### Planned Features

- **Leaderboards**  
  Showcase the top players for any skill or category among your group of friends.

- **Competitions**  
  Start and stop skill-based competitions, with live leaderboards to track progress.

---

## 🛠️ Commands

### General Commands

- `!addplayer`  
  Register your OSRS account by providing your username and selecting a game mode (Regular, Ironman, Hardcore Ironman, Ultimate Ironman).

- `!removeplayer`  
  Remove a registered OSRS account.

- `!userinfo`  
  View all OSRS accounts you’ve registered with the bot.

### Skill and Stat Commands

- `!lvl`  
  Fetch stats for a registered OSRS account. Examples:
  - `!lvl` - View all skill stats for your registered accounts.
  - `!lvl <skill>` - View a specific skill's level for your registered account.
  - `!lvl <skill> <osrsname>` - View a specific skill's level for another player's OSRS account.
  - `!lvl <osrsname>` - Fetch all stats for another player's OSRS account.

---

## 🧑‍💻 Tech Stack

- **Node.js**: Backend runtime.
- **Discord.js**: Library for interacting with the Discord API.
- **PostgreSQL**: Database to store user information.
- **Axios**: For making HTTP requests to the OSRS API.

---
