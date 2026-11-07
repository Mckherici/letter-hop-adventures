// The spelling friends a child can play with. Each one has its own illustration,
// welcome message and colour; the choice is saved on this device.
import { useCallback, useEffect, useState } from "react";
import fox from "@/assets/fox-mascot.png";
import owl from "@/assets/owl-mascot.png";

export type CharacterId = "fox" | "owl";

export interface Character {
  id: CharacterId;
  name: string;
  /** Speech bubble on the choose-a-friend screen. */
  welcome: string;
  /** Speech bubble on the home page. */
  homeGreeting: string;
  /** Spoken out loud when the child picks this friend. */
  spoken: string;
  /** Illustration file. */
  image: string;
  /** Marker that runs along the progress rainbow. */
  emoji: string;
  /** Candy colour for this friend's cards. */
  candy: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "fox",
    name: "Fizz the Fox",
    welcome: "Hi! I'm Fizz! I love bouncy, easy words!",
    homeGreeting: "Hi! I'm Fizz. Pick a path!",
    spoken: "Hi! I'm Fizz the fox! Let's spell!",
    image: fox,
    emoji: "🦊",
    candy: "var(--tangerine)",
  },
  {
    id: "owl",
    name: "Ollie the Owl",
    welcome: "Hoo-hoo! I'm Ollie! I know all the tricky words!",
    homeGreeting: "Hoo-hoo! I'm Ollie. Pick a path!",
    spoken: "Hoo hoo! I'm Ollie the owl! Let's spell!",
    image: owl,
    emoji: "🦉",
    candy: "var(--grape)",
  },
];

export const DEFAULT_CHARACTER: CharacterId = "fox";

const KEY = "spelling-safari-character-v1";

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === "string" && CHARACTERS.some((c) => c.id === value);
}

/** The friend for an id, falling back to Fizz so the game never shows a blank mascot. */
export function getCharacter(id: CharacterId | null | undefined): Character {
  return (
    CHARACTERS.find((c) => c.id === id) ??
    CHARACTERS.find((c) => c.id === DEFAULT_CHARACTER) ??
    CHARACTERS[0]!
  );
}

function read(): CharacterId {
  try {
    const raw = window.localStorage.getItem(KEY);
    return isCharacterId(raw) ? raw : DEFAULT_CHARACTER;
  } catch {
    return DEFAULT_CHARACTER;
  }
}

/** The friend the child chose, saved on this device. `ready` is false until it loads. */
export function useCharacter() {
  const [character, setCharacter] = useState<CharacterId>(DEFAULT_CHARACTER);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCharacter(read());
    setReady(true);
  }, []);

  const choose = useCallback((id: CharacterId) => {
    if (!isCharacterId(id)) return;
    setCharacter(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* storage blocked — keep playing with the friend in memory */
    }
  }, []);

  return { character, ready, choose };
}
