import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Lock, Star, Flame, BookHeart } from "lucide-react";
import { Scenery } from "@/components/game/Scenery";
import { Mascot } from "@/components/game/Mascot";
import { Button } from "@/components/ui/button";
import { LEVELS, isLevelUnlocked, nextSticker } from "@/lib/spelling";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spelling Safari — a rainbow spelling game for kids" },
      {
        name: "description",
        content:
          "A bright storybook spelling game: hear the word, see the picture, spell it with big bouncy letters and win stickers.",
      },
      { property: "og:title", content: "Spelling Safari — a rainbow spelling game for kids" },
      {
        property: "og:description",
        content: "Hear it, see it, spell it! Stars, streaks and stickers for little spellers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const LEVEL_STYLE: Record<string, string> = {
  easy: "[--candy:var(--success)]",
  medium: "[--candy:var(--accent)]",
  hard: "[--candy:var(--primary)]",
};

const TITLE = "Spelling Safari";

function Home() {
  const { progress, ready } = useProgress();
  const upcoming = nextSticker(progress.totalStars);

  return (
    <main className="relative min-h-screen overflow-x-hidden px-4 pb-16 pt-6">
      <Scenery />

      <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
        <StatBadge icon={<Star className="fill-sunny text-ink" />} value={progress.totalStars} />
        <StatBadge icon={<Flame className="fill-tangerine text-ink" />} value={progress.bestStreak} />
      </div>

      <section className="mx-auto mt-4 flex max-w-5xl flex-col items-center text-center">
        <h1 className="flex flex-wrap justify-center font-display text-6xl font-bold leading-none md:text-8xl">
          {TITLE.split("").map((ch, i) => (
            <motion.span
              key={i}
              className={cn(
                "text-sticker inline-block",
                ["text-tile-1", "text-tile-2", "text-tile-3", "text-tile-4", "text-tile-5", "text-tile-6"][
                  i % 6
                ],
                ch === " " && "w-5",
              )}
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: [0, -12, 0], opacity: 1 }}
              transition={{
                y: { duration: 1.8, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" },
                opacity: { delay: i * 0.05 },
              }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>
        <p className="mt-4 max-w-md rounded-full bg-paper/85 px-5 py-2 font-display text-xl font-semibold text-ink shadow-md md:text-2xl">
          Hear it 👂 See it 👀 Spell it! ✏️
        </p>

        <Mascot size="lg" className="mt-4" message="Hi! I'm Fizz. Pick a path!" />
      </section>

      <section className="mx-auto mt-6 grid max-w-5xl gap-5 md:grid-cols-3">
        {LEVELS.map((level, i) => {
          const open = !ready || isLevelUnlocked(level, progress.totalStars);
          const card = (
            <motion.div
              initial={{ y: 60, opacity: 0, rotate: i === 1 ? 0 : i === 0 ? -3 : 3 }}
              animate={{ y: 0, opacity: 1 }}
              {...(open ? { whileHover: { y: -8, rotate: 0, scale: 1.03 }, whileTap: { scale: 0.96 } } : {})}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.2 + i * 0.12 }}
              className={cn(
                "candy relative flex h-full flex-col items-center gap-1 rounded-[2rem] border-[5px] border-ink px-6 py-6 text-primary-foreground",
                LEVEL_STYLE[level.id],
                !open && "opacity-80 grayscale-[0.6]",
              )}
            >
              <span className="animate-wiggle text-6xl md:text-7xl">{level.emoji}</span>
              <span className="text-sticker font-display text-4xl font-bold">{level.name}</span>
              <span className="font-display text-lg font-semibold">{level.tagline}</span>
              {open ? (
                <span className="mt-3 rounded-full bg-paper px-6 py-2 font-display text-2xl font-bold text-ink">
                  Play ▶
                </span>
              ) : (
                <span className="mt-3 flex items-center gap-2 rounded-full bg-paper px-5 py-2 font-display text-xl font-bold text-ink">
                  <Lock className="size-5" /> {level.unlockAt} <Star className="size-5 fill-sunny" />
                </span>
              )}
            </motion.div>
          );
          return open ? (
            <Link key={level.id} to="/play/$level" params={{ level: level.id }} className="block">
              {card}
            </Link>
          ) : (
            <div key={level.id} aria-disabled title={`Collect ${level.unlockAt} stars to unlock`}>
              {card}
            </div>
          );
        })}
      </section>

      <section className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-3">
        <Button asChild variant="candySun" size="jumbo">
          <Link to="/stickers">
            <BookHeart /> My Sticker Book
          </Link>
        </Button>
        {ready && upcoming && (
          <p className="rounded-full bg-paper/85 px-4 py-1 font-display text-lg font-semibold text-ink shadow">
            Next sticker {upcoming.emoji} at {upcoming.unlockAt} ⭐
          </p>
        )}
      </section>
    </main>
  );
}

function StatBadge({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border-4 border-ink bg-paper px-4 py-1.5 font-display text-2xl font-bold text-ink shadow-md [&_svg]:size-7">
      {icon}
      <span>{value}</span>
    </div>
  );
}
