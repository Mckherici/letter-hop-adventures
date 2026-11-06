// Pure game rules for the spelling game: words, levels, tiles, scoring, rewards.

export type LevelId = "easy" | "medium" | "hard";

export interface Word {
  word: string;
  emoji: string;
}

export interface Level {
  id: LevelId;
  name: string;
  tagline: string;
  emoji: string;
  /** Extra wrong letters mixed into the tray. */
  decoys: number;
  /** Total stars needed before this level opens. */
  unlockAt: number;
  words: Word[];
}

export const WORDS_PER_ROUND = 8;
export const STARTING_LIVES = 3;
export const STREAK_BONUS_EVERY = 3;

export const LEVELS: Level[] = [
  {
    id: "easy",
    name: "Sprout",
    tagline: "3-letter words",
    emoji: "🌱",
    decoys: 0,
    unlockAt: 0,
    words: [
      { word: "cat", emoji: "🐱" },
      { word: "dog", emoji: "🐶" },
      { word: "sun", emoji: "☀️" },
      { word: "bus", emoji: "🚌" },
      { word: "pig", emoji: "🐷" },
      { word: "cow", emoji: "🐮" },
      { word: "bee", emoji: "🐝" },
      { word: "hat", emoji: "🎩" },
      { word: "egg", emoji: "🥚" },
      { word: "owl", emoji: "🦉" },
      { word: "fox", emoji: "🦊" },
      { word: "car", emoji: "🚗" },
      { word: "bed", emoji: "🛏️" },
      { word: "ant", emoji: "🐜" },
      { word: "bat", emoji: "🦇" },
      { word: "key", emoji: "🔑" },
    ],
  },
  {
    id: "medium",
    name: "Explorer",
    tagline: "4 & 5-letter words",
    emoji: "🧭",
    decoys: 2,
    unlockAt: 10,
    words: [
      { word: "fish", emoji: "🐟" },
      { word: "frog", emoji: "🐸" },
      { word: "duck", emoji: "🦆" },
      { word: "cake", emoji: "🍰" },
      { word: "star", emoji: "⭐" },
      { word: "moon", emoji: "🌙" },
      { word: "ball", emoji: "⚽" },
      { word: "bear", emoji: "🐻" },
      { word: "tree", emoji: "🌳" },
      { word: "lion", emoji: "🦁" },
      { word: "boat", emoji: "⛵" },
      { word: "apple", emoji: "🍎" },
      { word: "horse", emoji: "🐴" },
      { word: "train", emoji: "🚂" },
      { word: "house", emoji: "🏠" },
      { word: "mouse", emoji: "🐭" },
      { word: "snake", emoji: "🐍" },
      { word: "pizza", emoji: "🍕" },
      { word: "whale", emoji: "🐳" },
      { word: "robot", emoji: "🤖" },
    ],
  },
  {
    id: "hard",
    name: "Wizard",
    tagline: "Big tricky words",
    emoji: "🧙",
    decoys: 3,
    unlockAt: 30,
    words: [
      { word: "rocket", emoji: "🚀" },
      { word: "monkey", emoji: "🐵" },
      { word: "rabbit", emoji: "🐰" },
      { word: "banana", emoji: "🍌" },
      { word: "turtle", emoji: "🐢" },
      { word: "flower", emoji: "🌸" },
      { word: "carrot", emoji: "🥕" },
      { word: "castle", emoji: "🏰" },
      { word: "guitar", emoji: "🎸" },
      { word: "cookie", emoji: "🍪" },
      { word: "dragon", emoji: "🐉" },
      { word: "pencil", emoji: "✏️" },
      { word: "rainbow", emoji: "🌈" },
      { word: "giraffe", emoji: "🦒" },
      { word: "penguin", emoji: "🐧" },
      { word: "octopus", emoji: "🐙" },
      { word: "unicorn", emoji: "🦄" },
      { word: "balloon", emoji: "🎈" },
      { word: "elephant", emoji: "🐘" },
      { word: "butterfly", emoji: "🦋" },
    ],
  },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function isLevelUnlocked(level: Level, totalStars: number): boolean {
  return totalStars >= level.unlockAt;
}

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

export function pickRoundWords(level: Level, count = WORDS_PER_ROUND, rand = Math.random): Word[] {
  return shuffle(level.words, rand).slice(0, Math.min(count, level.words.length));
}

export interface Tile {
  id: string;
  letter: string;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** All letters of the word plus `decoys` letters not in the word, shuffled. Never in spelled order. */
export function buildTiles(word: string, decoys: number, rand: () => number = Math.random): Tile[] {
  const letters = word.toLowerCase().split("");
  const pool = ALPHABET.split("").filter((c) => !letters.includes(c));
  const extras = shuffle(pool, rand).slice(0, decoys);
  const all = [...letters, ...extras];
  let mixed = shuffle(all, rand);
  // Avoid handing over the answer in order (when it's possible to mix it up).
  for (let tries = 0; tries < 10 && new Set(letters).size > 1; tries++) {
    if (mixed.slice(0, letters.length).join("") !== word) break;
    mixed = shuffle(all, rand);
  }
  return mixed.map((letter, i) => ({ id: `${i}-${letter}`, letter }));
}

export function isCorrect(word: string, attempt: string[]): boolean {
  return attempt.join("").toLowerCase() === word.toLowerCase();
}

/** 3 stars for a clean spell, 2 after one slip (mistake or hint), otherwise 1. */
export function starsForWord(mistakes: number, hintsUsed: number): number {
  const slips = mistakes + hintsUsed;
  if (slips === 0) return 3;
  if (slips === 1) return 2;
  return 1;
}

/** Bonus star every STREAK_BONUS_EVERY words in a row. */
export function streakBonus(streak: number): number {
  return streak > 0 && streak % STREAK_BONUS_EVERY === 0 ? 1 : 0;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  unlockAt: number;
}

export const STICKERS: Sticker[] = [
  { id: "ladybug", emoji: "🐞", name: "Lucky Ladybug", unlockAt: 5 },
  { id: "rainbow", emoji: "🌈", name: "Rainbow", unlockAt: 10 },
  { id: "icecream", emoji: "🍦", name: "Ice Cream", unlockAt: 20 },
  { id: "rocket", emoji: "🚀", name: "Rocket", unlockAt: 30 },
  { id: "octopus", emoji: "🐙", name: "Ollie Octopus", unlockAt: 45 },
  { id: "crown", emoji: "👑", name: "Golden Crown", unlockAt: 60 },
  { id: "dino", emoji: "🦖", name: "Dino Roar", unlockAt: 80 },
  { id: "unicorn", emoji: "🦄", name: "Unicorn", unlockAt: 100 },
  { id: "planet", emoji: "🪐", name: "Ringed Planet", unlockAt: 125 },
  { id: "dragon", emoji: "🐲", name: "Friendly Dragon", unlockAt: 150 },
  { id: "trophy", emoji: "🏆", name: "Big Trophy", unlockAt: 180 },
  { id: "wizard", emoji: "🧙", name: "Word Wizard", unlockAt: 220 },
];

export function unlockedStickers(totalStars: number): Sticker[] {
  return STICKERS.filter((s) => totalStars >= s.unlockAt);
}

export function nextSticker(totalStars: number): Sticker | undefined {
  return STICKERS.find((s) => totalStars < s.unlockAt);
}

/** Stickers that became unlocked going from `before` to `after` stars. */
export function newlyUnlocked(before: number, after: number): Sticker[] {
  return STICKERS.filter((s) => before < s.unlockAt && after >= s.unlockAt);
}
