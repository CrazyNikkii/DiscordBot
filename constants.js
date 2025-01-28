// Skill list
const SKILLS_AND_ACTIVITIES = [
  // SKILLS
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
  // ACTIVITIES
  "League Points",
  "Deadman Points",
  "Bounty Hunter - Hunter",
  "Bounty Hunter - Rogue",
  "Bounty Hunter (Legacy) - Hunter",
  "Bounty Hunter (Legacy) - Rogue",
  "Clue Scrolls (all)",
  "Clue Scrolls (beginner)",
  "Clue Scrolls (easy)",
  "Clue Scrolls (medium)",
  "Clue Scrolls (hard)",
  "Clue Scrolls (elite)",
  "Clue Scrolls (master)",
  "LMS - Rank",
  "PvP Arena - Rank",
  "Soul Wars Zeal",
  "Rifts closed",
  "Colosseum Glory",
  "Abyssal Sire",
  "Alchemical Hydra",
  "Amoxliatl",
  "Araxxor",
  "Artio",
  "Barrows Chests",
  "Bryophyta",
  "Callisto",
  "Cal'varion",
  "Cerberus",
  "Chambers of Xeric",
  "Chambers of Xeric: Challenge Mode",
  "Chaos Elemental",
  "Chaos Fanatic",
  "Commander Zilyana",
  "Corporeal Beast",
  "Crazy Archaeologist",
  "Dagannoth Prime",
  "Dagannoth Rex",
  "Dagannoth Supreme",
  "Deranged Archaeologist",
  "Duke Sucellus",
  "General Graardor",
  "Giant Mole",
  "Grotesque Guardians",
  "Hespori",
  "Kalphite Queen",
  "King Black Dragon",
  "Kraken",
  "Kree'Arra",
  "K'ril Tsutsaroth",
  "Lunar Chests",
  "Mimic",
  "Nex",
  "Nightmare",
  "Phosani's Nightmare",
  "Obor",
  "Phantom Muspah",
  "Sarachnis",
  "Scorpia",
  "Scurrius",
  "Skotizo",
  "Sol Heredit",
  "Spindel",
  "Tempoross",
  "The Gauntlet",
  "The Corrupted Gauntlet",
  "The Hueycoatl",
  "The Leviathan",
  "The Whisperer",
  "Theatre of Blood",
  "Theatre of Blood: Hard Mode",
  "Thermonuclear Smoke Devil",
  "Tombs of Amascut",
  "Tombs of Amascut: Expert Mode",
  "TzKal-Zuk",
  "TzTok-Jad",
  "Vardorvis",
  "Venenatis",
  "Vet'ion",
  "Vorkath",
  "Wintertodt",
  "Zalcano",
  "Zulrah",
].map((a) => a.toLowerCase());

const ALIAS_MAP = {
  atk: "attack",
  def: "defence",
  str: "strenght",
  hp: "hitpoints",
  range: "ranged",
  mage: "magic",
  rc: "runecrafting",
  tob: "theatre of blood",
  toa: "tombs of amascut",
};

// Custom emojis
const CUSTOM_EMOJIS = {
  RegEmoji: "<:pmodcrown:1331210130481483847>",
  IMEmoji: "<:OSstandardIM:1331208060760494153>",
  HCEmoji: "<:OSHarcoreIM:1331208059678101534>",
  UIMEmoji: "<:UltimateIM:1331208063079940126>",
  CancelEmoji: "❌",
};

module.exports = { SKILLS_AND_ACTIVITIES, ALIAS_MAP, CUSTOM_EMOJIS };
