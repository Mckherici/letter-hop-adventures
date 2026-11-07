import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import {
  CHARACTERS,
  DEFAULT_CHARACTER,
  getCharacter,
  isCharacterId,
} from "@/lib/characters";

describe("spelling friends", () => {
  it("offers Fizz the fox and Ollie the owl, each with its own picture and welcome", () => {
    expect(CHARACTERS.map((c) => c.id)).toEqual(["fox", "owl"]);

    const images = new Set<string>();
    const welcomes = new Set<string>();
    for (const c of CHARACTERS) {
      expect(c.name.length, c.id).toBeGreaterThan(0);
      expect(c.welcome.trim().length, c.id).toBeGreaterThan(0);
      expect(c.homeGreeting.trim().length, c.id).toBeGreaterThan(0);
      expect(c.spoken.trim().length, c.id).toBeGreaterThan(0);
      expect(c.image.length, c.id).toBeGreaterThan(0);
      images.add(c.image);
      welcomes.add(c.welcome);
    }
    // Each friend must be visually and verbally distinct, not a copy of the other.
    expect(images.size).toBe(CHARACTERS.length);
    expect(welcomes.size).toBe(CHARACTERS.length);
  });

  it("keeps Fizz the default friend and never returns a blank one", () => {
    expect(DEFAULT_CHARACTER).toBe("fox");
    expect(getCharacter("owl").name).toContain("Ollie");
    expect(getCharacter(undefined).id).toBe("fox");
    expect(getCharacter("dragon" as never).id).toBe("fox");
    expect(isCharacterId("owl")).toBe(true);
    expect(isCharacterId("dragon")).toBe(false);
  });

  it("shows the choose-a-friend screen before the game", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/character");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
