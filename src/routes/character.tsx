import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { House, Star } from "lucide-react";
import { Scenery } from "@/components/game/Scenery";
import { Button } from "@/components/ui/button";
import {
  CHARACTERS,
  getCharacter,
  useCharacter,
  type Character,
  type CharacterId,
} from "@/lib/characters";
import { LEVELS, type LevelId } from "@/lib/spelling";
import { useProgress } from "@/lib/progress";
import { sfx, speak } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/character")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search["level"];
    return { level: LEVELS.some((l) => l.id === raw) ? (raw as LevelId) : undefined };
  },
  head: () => ({
    meta: [
      { title: "Choose your spelling friend — Spelling Safari" },
      {
        name: "description",
        content:
          "Pick Fizz the fox or Ollie the owl. Each friend has their own picture and their own welcome.",
      },
      { property: "og:title", content: "Choose your spelling friend — Spelling Safari" },
      {
        property: "og:description",
        content: "Fizz the fox or Ollie the owl? Say hello, then start spelling with big bouncy letters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CharacterScreen,
});

const PICK_SPOKEN_AT = 250;
const GO_AT = 1900;

function CharacterScreen() {
  const { level } = useSearch({ from: "/character" });
  const { character: chosen, choose } = useCharacter();
  const { progress, ready } = useProgress();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<CharacterId | null>(null);
  const timer = useRef<number | null>(null);

  const target = LEVELS.find((l) => l.id === level);

  useEffect(() => {
    speak("Who will spell with you?", { rate: 0.9 });
    return () => {
      window.speechSynthesis?.cancel();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const pick = (next: Character) => {
    if (picked) return;
    setPicked(next.id);
    choose(next.id);
    sfx.success();
    timer.current = window.setTimeout(() => speak(next.spoken, { rate: 0.9 }), PICK_SPOKEN_AT);
    timer.current = window.setTimeout(() => {
      if (level) navigate({ to: "/play/$level", params: { level } });
      else navigate({ to: "/" });
    }, GO_AT);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 pb-14 pt-6">
      <Scenery />

      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Button asChild variant="candyPaper" size="bubble" aria-label="Home">
          <Link to="/">
            <House />
          </Link>
        </Button>
        <div className="flex items-center gap-2 rounded-full border-4 border-ink bg-paper px-4 py-1.5 font-display text-2xl font-bold text-ink shadow-md">
          <Star className="size-7 fill-sunny" /> {ready ? progress.totalStars : 0}
        </div>
      </div>

      <section className="mx-auto mt-4 flex max-w-4xl flex-col items-center text-center">
        <h1 className="text-rainbow animate-rainbow font-display text-5xl font-bold leading-tight md:text-7xl">
          Who will spell with you?
        </h1>
        <p className="mt-3 max-w-md rounded-full bg-paper/85 px-5 py-2 font-display text-xl font-semibold text-ink shadow-md md:text-2xl">
          {target
            ? `${target.emoji} ${target.name} is waiting — say hello to a friend!`
            : "Tap a friend to say hello!"}
        </p>
      </section>

      <section className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
        {CHARACTERS.map((c, i) => {
          const isPicked = picked === c.id;
          const isDimmed = picked !== null && !isPicked;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              aria-label={`Play with ${c.name}`}
              initial={{ y: 70, opacity: 0, rotate: i === 0 ? -3 : 3 }}
              animate={{
                y: 0,
                opacity: isDimmed ? 0.45 : 1,
                scale: isPicked ? 1.06 : 1,
                rotate: isPicked ? 0 : i === 0 ? -2 : 2,
              }}
              {...(isDimmed || picked ? {} : { whileHover: { y: -10, rotate: 0, scale: 1.04 } })}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 + i * 0.12 }}
              style={{ ["--candy" as string]: c.candy }}
              className="candy relative flex flex-col items-center rounded-[2.25rem] border-[5px] border-ink px-5 py-6 text-primary-foreground"
            >
              {chosen === c.id && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-4 border-ink bg-sunny px-4 py-1 font-display text-base font-bold text-ink shadow-md">
                  You played with me last!
                </span>
              )}

              <motion.img
                src={c.image}
                alt={c.name}
                width={1024}
                height={1024}
                loading="lazy"
                draggable={false}
                animate={
                  isPicked
                    ? { y: [0, -60, 0, -25, 0], rotate: [0, -12, 12, -6, 0], scale: [1, 1.12, 1] }
                    : { y: [0, -14, 0], rotate: [-2, 2, -2] }
                }
                transition={
                  isPicked
                    ? { duration: 1.1, ease: "easeOut" }
                    : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                }
                className="h-44 w-44 select-none drop-shadow-xl md:h-56 md:w-56"
              />

              <span className="text-sticker mt-2 font-display text-3xl font-bold md:text-4xl">
                {c.name}
              </span>

              <span className="storybook-card mt-3 max-w-[20rem] rounded-3xl px-4 py-2 text-center font-display text-lg font-semibold leading-tight text-ink">
                {c.welcome}
              </span>

              <span className="mt-4 rounded-full bg-paper px-6 py-2 font-display text-2xl font-bold text-ink">
                {isPicked ? "Hooray! ▶" : "Play with me ▶"}
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="mx-auto mt-10 flex max-w-4xl justify-center">
        <p className="rounded-full bg-paper/85 px-5 py-2 text-center font-display text-lg font-semibold text-ink shadow">
          {getCharacter(picked ?? chosen).spoken}
        </p>
      </section>
    </main>
  );
}
