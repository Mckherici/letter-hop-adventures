import { describe, expect, it } from "vitest";
import { LEVELS } from "@/lib/spelling";
import { pictureFor } from "@/lib/wordPictures";

describe("word pictures", () => {
  it("every word in every level has its own matching picture file", () => {
    for (const level of LEVELS) {
      for (const { word } of level.words) {
        expect(pictureFor(word), word).toMatch(new RegExp(`/${word}\\.png$`));
      }
    }
  });
});
