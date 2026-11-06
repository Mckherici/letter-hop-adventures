import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { House, Star, Lock } from "lucide-react";
import { Scenery } from "@/components/game/Scenery";
import { Mascot } from "@/components/game/Mascot";
import { Button } from "@/components/ui/button";
import { STICKERS, unlockedStickers } from "@/lib/spelling";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sounds";

export const Route = createFileRoute("/stickers")({
  head: () => ({
    meta: [
      { title: "My Sticker Book — Spelling Safari" },
      {
        name: "description",
        content: "See every sticker you've won by spelling words and collecting stars.",
      },
      { property: "og:title", content: "My Sticker Book — Spelling Safari" },
      {
        property: "og:description",
        content: "Collect stars, unlock dinosaurs, unicorns, dragons and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StickerBook,
});

const BACKS = [
  "[--candy:var(--tile-1)]",
  "[--candy:var(--tile-2)]",
  "[--candy:var(--tile-3)]",
  "[--candy:var(--tile-4)]",
  "[--candy:var(--tile-5)]",
  "[--candy:var(--tile-6)]",
];

function StickerBook() {
  const { progress, ready } = useProgress();
  const owned = unlockedStickers(progress.totalStars).length;

  return (
    <main className="relative min-h-screen px-4 pb-16 pt-6">
      <Scenery />
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Button asChild variant="candyPaper" size="bubble" aria-label="Home">
          <Link to="/">
            <House />
          </Link>
        </Button>
        <div className="flex items-center gap-2 rounded-full border-4 border-ink bg-paper px-4 py-1.5 font-display text-2xl font-bold text-ink shadow-md">
          <Star className="size-7 fill-sunny" /> {progress.totalStars}
        </div>
      </div>

      <div className="storybook-card mx-auto mt-6 max-w-5xl p-6 md:p-10">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-rainbow animate-rainbow font-display text-5xl font-bold md:text-6xl">
              My Sticker Book
            </h1>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {ready ? `${owned} of ${STICKERS.length} stickers collected!` : "Opening your book…"}
            </p>
          </div>
          <Mascot size="sm" message={owned > 0 ? "Wow, so shiny!" : "Spell words to win!"} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {STICKERS.map((s, i) => {
            const have = ready && progress.totalStars >= s.unlockAt;
            return (
              <motion.button
                key={s.id}
                type="button"
                onClick={() => have && sfx.sparkle()}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: have ? (i % 2 ? 3 : -3) : 0 }}
                whileHover={have ? { scale: 1.08, rotate: 0 } : undefined}
                whileTap={have ? { scale: 0.9, rotate: 12 } : undefined}
                transition={{ type: "spring", stiffness: 300, damping: 14, delay: i * 0.05 }}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-[1.75rem] border-4 border-ink p-3",
                  have ? cn("candy", BACKS[i % BACKS.length]) : "border-dashed bg-muted",
                )}
              >
                {have ? (
                  <>
                    <span className="text-6xl drop-shadow md:text-7xl">{s.emoji}</span>
                    <span className="rounded-full bg-paper px-3 py-0.5 font-display text-sm font-bold text-ink md:text-base">
                      {s.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="size-10 text-muted-foreground" />
                    <span className="flex items-center gap-1 font-display text-xl font-bold text-muted-foreground">
                      {s.unlockAt} <Star className="size-5 fill-sunny text-ink" />
                    </span>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
