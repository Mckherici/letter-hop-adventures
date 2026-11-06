import { describe, expect, it } from "vitest";
import {
  LEVELS,
  STARTING_LIVES,
  buildTiles,
  isCorrect,
  newlyUnlocked,
  starsForWord,
  streakBonus,
} from "@/lib/spelling";

describe("spelling rules", () => {
  it("gives the player 3 lives", () => {
    expect(STARTING_LIVES).toBe(3);
  });

  it("tray holds every letter of the word plus the level's decoys", () => {
    const tiles = buildTiles("rabbit", 3);
    expect(tiles).toHaveLength(9);
    const letters = tiles.map((t) => t.letter).sort();
    for (const ch of "rabbit") {
      const i = letters.indexOf(ch);
      expect(i).toBeGreaterThanOrEqual(0);
      letters.splice(i, 1);
    }
    expect(letters.every((l) => !"rabbit".includes(l))).toBe(true);
  });

  it("checks spelling case-insensitively", () => {
    expect(isCorrect("cat", ["C", "a", "t"])).toBe(true);
    expect(isCorrect("cat", ["c", "t", "a"])).toBe(false);
  });

  it("scores 3 stars clean, 2 after one slip, 1 after more", () => {
    expect(starsForWord(0, 0)).toBe(3);
    expect(starsForWord(1, 0)).toBe(2);
    expect(starsForWord(0, 1)).toBe(2);
    expect(starsForWord(1, 1)).toBe(1);
  });

  it("adds a bonus star every 3 words in a row", () => {
    expect(streakBonus(2)).toBe(0);
    expect(streakBonus(3)).toBe(1);
    expect(streakBonus(6)).toBe(1);
  });

  it("unlocks levels and stickers at star thresholds", () => {
    expect(LEVELS.map((l) => l.unlockAt)).toEqual([0, 10, 30]);
    expect(newlyUnlocked(4, 11).map((s) => s.id)).toEqual(["ladybug", "rainbow"]);
  });
});
