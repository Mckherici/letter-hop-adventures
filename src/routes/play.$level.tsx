import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  House,
  Flame,
  Star,
  Volume2,
  VolumeX,
  Lightbulb,
  RotateCcw,
  Lock,
} from "lucide-react";
import { Scenery } from "@/components/game/Scenery";
import { Mascot, type Mood } from "@/components/game/Mascot";
import { tileColor } from "@/components/game/tileColors";
import { WordPicture } from "@/components/game/WordPicture";
import { Button } from "@/components/ui/button";
import {
  LEVELS,
  STARTING_LIVES,
  buildTiles,
  getLevel,
  isCorrect,
  isLevelUnlocked,
  newlyUnlocked,
  pickRoundWords,
  starsForWord,
  streakBonus,
  type Level,
  type Sticker,
  type Tile,
  type Word,
} from "@/lib/spelling";
import { useProgress } from "@/lib/progress";
import { sfx, speak, setMuted } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play/$level")({
  loader: ({ params }) => {
    const level = getLevel(params.level);
    if (!level) throw notFound();
    return { levelId: level.id };
  },
  head: ({ loaderData }) => {
    const level = loaderData ? getLevel(loaderData.levelId) : undefined;
    const title = level
      ? `${level.name} level — Spelling Safari`
      : "Spelling level — Spelling Safari";
    const description = level
      ? `Spell ${level.tagline.toLowerCase()} with big bouncy letters, keep your streak and win stars.`
      : "Spell words with big bouncy letters.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PlayPage,
});

const CHEERS = ["Amazing!", "You did it!", "Super speller!", "Wow, brilliant!", "High five! ✋"];
const OOPS = ["Oops! Try again!", "So close!", "Almost! Have another go!"];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)] ?? list[0] ?? "";

type Status = "playing" | "correct" | "wrong" | "over" | "done";

function PlayPage() {
  const { levelId } = Route.useLoaderData();
  const level = getLevel(levelId)!;
  const { progress, ready, update } = useProgress();
  const [runKey, setRunKey] = useState(0);

  if (!ready) return <Loading />;
  if (!isLevelUnlocked(level, progress.totalStars)) return <LockedScreen level={level} />;

  return (
    <Game
      key={`${level.id}-${runKey}`}
      level={level}
      totalStars={progress.totalStars}
      onRestart={() => setRunKey((k) => k + 1)}
      onWordWon={(stars, streak) =>
        update((p) => ({
          totalStars: p.totalStars + stars,
          bestStreak: Math.max(p.bestStreak, streak),
          wordsSpelled: p.wordsSpelled + 1,
        }))
      }
    />
  );
}

interface GameProps {
  level: Level;
  totalStars: number;
  onWordWon: (stars: number, streak: number) => void;
  onRestart: () => void;
}

function Game({ level, totalStars, onWordWon, onRestart }: GameProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [wrongFlash, setWrongFlash] = useState<boolean[]>([]);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [streak, setStreak] = useState(0);
  const [bestRunStreak, setBestRunStreak] = useState(0);
  const [roundStars, setRoundStars] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [mood, setMood] = useState<Mood>("idle");
  const [message, setMessage] = useState("Listen and spell!");
  const [earned, setEarned] = useState<{ id: number; stars: number; bonus: number } | null>(null);
  const [newSticker, setNewSticker] = useState<Sticker | null>(null);
  const [muted, setMutedState] = useState(false);
  const starsRef = useRef(totalStars);
  const timers = useRef<number[]>([]);
  const pendingAdvance = useRef<(() => void) | null>(null);

  const word = words[index];
  const tileById = useMemo(() => new Map(tiles.map((t) => [t.id, t])), [tiles]);
  const usedIds = useMemo(() => new Set(slots.filter(Boolean) as string[]), [slots]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const sayWord = useCallback((w: string, intro = false) => {
    speak(intro ? `Can you spell... ${w}?` : w, { rate: intro ? 0.85 : 0.7 });
  }, []);

  const startWord = useCallback(
    (w: Word) => {
      setTiles(buildTiles(w.word, level.decoys));
      setSlots(Array(w.word.length).fill(null));
      setLocked(Array(w.word.length).fill(false));
      setWrongFlash(Array(w.word.length).fill(false));
      setMistakes(0);
      setHints(0);
      setStatus("playing");
      setMood("idle");
      setMessage("Listen and spell!");
      window.setTimeout(() => sayWord(w.word, true), 450);
    },
    [level.decoys, sayWord],
  );

  // Pick the round in the browser so the shuffle never mismatches the server render.
  useEffect(() => {
    const round = pickRoundWords(level);
    setWords(round);
    if (round[0]) startWord(round[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const celebrate = async () => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, scalar: 1.2 });
    later(() => confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 } }), 200);
    later(() => confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 } }), 350);
  };

  const evaluate = (nextSlots: (string | null)[], usedHints: number) => {
    if (!word || nextSlots.some((s) => s === null)) return;
    const letters = nextSlots.map((id) => tileById.get(id!)!.letter);

    if (isCorrect(word.word, letters)) {
      const newStreak = streak + 1;
      const stars = starsForWord(mistakes, usedHints);
      const bonus = streakBonus(newStreak);
      const gained = stars + bonus;
      setStatus("correct");
      setStreak(newStreak);
      setBestRunStreak((b) => Math.max(b, newStreak));
      setRoundStars((s) => s + gained);
      setLocked(nextSlots.map(() => true));
      setMood("happy");
      setMessage(bonus ? `${newStreak} in a row! Bonus star!` : pick(CHEERS));
      setEarned({ id: Date.now(), stars, bonus });
      sfx.success();
      void celebrate();
      speak(`${word.word.split("").join(", ")}. ${word.word}! ${bonus ? "You're on fire!" : "Great job!"}`, {
        rate: 0.9,
      });

      const before = starsRef.current;
      const after = before + gained;
      starsRef.current = after;
      onWordWon(gained, newStreak);
      const unlocked = newlyUnlocked(before, after);

      const advance = () => {
        setEarned(null);
        if (index + 1 >= words.length) {
          setStatus("done");
          setMood("party");
          sfx.fanfare();
          speak("Hooray! You finished the round!");
        } else {
          const nextWord = words[index + 1];
          setIndex(index + 1);
          if (nextWord) startWord(nextWord);
        }
      };

      const prize = unlocked[unlocked.length - 1];
      if (prize) {
        later(() => {
          setNewSticker(prize);
          sfx.fanfare();
          speak(`New sticker! ${prize.name}!`);
        }, 1600);
        // advance happens when the sticker popup is closed
        pendingAdvance.current = advance;
      } else {
        later(advance, 2400);
      }
    } else {
      const wrong = letters.map((l, i) => l !== word.word[i]);
      const livesLeft = lives - 1;
      setStatus("wrong");
      setWrongFlash(wrong);
      setLives(livesLeft);
      setStreak(0);
      setMistakes((m) => m + 1);
      setMood("sad");
      setMessage(pick(OOPS));
      sfx.oops();
      later(() => {
        if (livesLeft <= 0) {
          setStatus("over");
          setMessage("Let's try again!");
          speak(`The word was ${word.word}. Let's try again!`);
          return;
        }
        // Keep letters in the right spot, send the rest back to the tray.
        setSlots((cur) => cur.map((id, i) => (wrong[i] ? null : id)));
        setLocked((cur) => cur.map((l, i) => l || !wrong[i]));
        setWrongFlash(wrong.map(() => false));
        setStatus("playing");
        setMood("idle");
        sayWord(word.word);
      }, 1100);
    }
  };

  const placeTile = (tileId: string, slotIndex?: number) => {
    if (status !== "playing" || usedIds.has(tileId)) return;
    const target = slotIndex ?? slots.findIndex((s) => s === null);
    if (target < 0 || target >= slots.length || locked[target]) return;
    const next = [...slots];
    next[target] = tileId;
    setSlots(next);
    sfx.pop();
    evaluate(next, hints);
  };

  const removeFromSlot = (i: number) => {
    if (status !== "playing" || locked[i] || !slots[i]) return;
    const next = [...slots];
    next[i] = null;
    setSlots(next);
    sfx.unpop();
  };

  const giveHint = () => {
    if (status !== "playing" || !word) return;
    const i = slots.findIndex((id, idx) => !locked[idx] && (!id || tileById.get(id)!.letter !== word.word[idx]));
    if (i < 0) return;
    const needed = word.word[i];
    if (!needed) return;
    const next = [...slots];
    // Free a matching tile if it's sitting in a wrong unlocked slot.
    let tile = tiles.find((t) => t.letter === needed && !usedIds.has(t.id));
    if (!tile) {
      const j = next.findIndex(
        (id, idx) => id && !locked[idx] && tileById.get(id)!.letter === needed && word.word[idx] !== needed,
      );
      if (j >= 0) {
        tile = tileById.get(next[j]!);
        next[j] = null;
      }
    }
    if (!tile) return;
    next[i] = tile.id;
    const nextLocked = [...locked];
    nextLocked[i] = true;
    setSlots(next);
    setLocked(nextLocked);
    const usedHints = hints + 1;
    setHints(usedHints);
    setMessage(`It's a "${needed.toUpperCase()}"!`);
    sfx.sparkle();
    speak(needed);
    evaluate(next, usedHints);
  };

  const toggleMute = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  const closeSticker = () => {
    setNewSticker(null);
    const go = pendingAdvance.current;
    pendingAdvance.current = null;
    go?.();
  };

  if (!word) return <Loading />;

  const nextLevel = LEVELS[LEVELS.findIndex((l) => l.id === level.id) + 1];

  const progressPct = ((index + (status === "correct" || status === "done" ? 1 : 0)) / words.length) * 100;

  return (
    <main className="relative min-h-screen overflow-x-hidden px-3 pb-10 pt-4 md:px-6">
      <Scenery />

      {/* Top bar */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Button asChild variant="candyPaper" size="bubble" aria-label="Home">
          <Link to="/">
            <House />
          </Link>
        </Button>

        <div className="flex items-center gap-1 rounded-full border-4 border-ink bg-paper px-3 py-1.5 shadow-md">
          {Array.from({ length: STARTING_LIVES }).map((_, i) => (
            <motion.span
              key={i}
              animate={i < lives ? { scale: [1, 1.15, 1] } : { scale: 0.75, rotate: -20 }}
              transition={i < lives ? { duration: 1.2, repeat: Infinity, delay: i * 0.2 } : {}}
            >
              <Heart
                className={cn(
                  "size-8 text-ink",
                  i < lives ? "fill-primary" : "fill-muted opacity-50",
                )}
              />
            </motion.span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.div
            key={streak}
            initial={{ scale: 1.6 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex items-center gap-1 rounded-full border-4 border-ink px-3 py-1.5 font-display text-2xl font-bold shadow-md",
              streak >= 3 ? "candy [--candy:var(--tangerine)] text-primary-foreground" : "bg-paper text-ink",
            )}
            aria-label={`Streak ${streak}`}
          >
            <Flame className={cn("size-7", streak > 0 ? "fill-sunny text-ink" : "text-muted-foreground")} />
            {streak}
          </motion.div>
          <div className="relative flex items-center gap-1 rounded-full border-4 border-ink bg-paper px-3 py-1.5 font-display text-2xl font-bold text-ink shadow-md">
            <Star className="size-7 fill-sunny" />
            {roundStars}
          </div>
          <Button variant="candyPaper" size="bubble" onClick={toggleMute} aria-label={muted ? "Sound on" : "Sound off"}>
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
      </header>

      {/* Progress rainbow */}
      <div className="mx-auto mt-5 max-w-5xl">
        <div className="relative h-7 rounded-full border-4 border-ink bg-paper shadow-md">
          <motion.div
            className="bg-rainbow animate-rainbow h-full rounded-full"
            animate={{ width: `${Math.max(progressPct, 4)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
          <motion.span
            className="absolute -top-5 text-4xl"
            animate={{ left: `calc(${Math.max(progressPct, 4)}% - 1.25rem)` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            🦊
          </motion.span>
          <span className="absolute -right-3 -top-5 text-4xl">🏁</span>
        </div>
        <p className="mt-2 text-center font-display text-lg font-semibold text-ink">
          {level.emoji} {level.name} · Word {Math.min(index + 1, words.length)} of {words.length}
        </p>
      </div>

      {/* Picture + mascot */}
      <section className="mx-auto mt-4 flex max-w-5xl flex-col items-center justify-center gap-4 md:flex-row md:items-end md:gap-10">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={word.word}
              initial={{ scale: 0, rotate: -25 }}
              animate={{
                scale: 1,
                rotate: status === "wrong" ? [0, -6, 6, -4, 0] : 0,
              }}
              exit={{ scale: 0, rotate: 25, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
              className="storybook-card relative flex h-56 w-56 items-center justify-center overflow-hidden md:h-72 md:w-72"
            >
              <motion.div
                aria-hidden
                className="bg-sunburst absolute inset-[-40%] opacity-30"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="relative select-none drop-shadow-lg"
                animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <WordPicture word={word.word} className="h-40 w-40 md:h-52 md:w-52" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            className="absolute -bottom-5 -right-5"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <Button
              variant="candySky"
              size="bubble"
              className="h-20 w-20 [&_svg]:size-10"
              onClick={() => sayWord(word.word)}
              aria-label="Hear the word again"
            >
              <Volume2 />
            </Button>
          </motion.div>

          {/* Floating star reward */}
          <AnimatePresence>
            {earned && (
              <motion.div
                key={earned.id}
                className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center gap-1"
                initial={{ opacity: 0, y: 20, scale: 0.4 }}
                animate={{ opacity: 1, y: -90, scale: 1.2 }}
                exit={{ opacity: 0, y: -160 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                {Array.from({ length: earned.stars + earned.bonus }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-5xl drop-shadow-lg"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    {i >= earned.stars ? "🔥" : "⭐"}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Mascot mood={mood} message={message} size="md" className="hidden md:flex" />
      </section>

      {/* Answer slots */}
      <section
        className="mx-auto mt-10 flex max-w-5xl justify-center gap-2 md:gap-3"
        style={{ ["--n" as string]: word.word.length }}
      >
        {slots.map((id, i) => {
          const tile = id ? tileById.get(id) : undefined;
          const colorIdx = tile ? tiles.indexOf(tile) : 0;
          return (
            <motion.button
              key={i}
              type="button"
              data-slot-index={i}
              onClick={() => removeFromSlot(i)}
              aria-label={tile ? `Letter ${tile.letter}, tap to take back` : `Empty box ${i + 1}`}
              animate={
                wrongFlash[i]
                  ? { x: [0, -8, 8, -6, 6, 0] }
                  : status === "correct"
                    ? { y: [0, -24, 0] }
                    : { y: 0 }
              }
              transition={status === "correct" ? { delay: i * 0.08, duration: 0.5 } : { duration: 0.4 }}
              className={cn(
                "flex aspect-[4/5] w-[min(5rem,calc((100vw-2rem)/var(--n)-0.5rem))] items-center justify-center rounded-2xl border-4 font-display text-[clamp(1.75rem,8vw,3.5rem)] font-bold uppercase md:rounded-3xl",
                tile
                  ? cn("candy border-ink", tileColor(colorIdx))
                  : "border-dashed border-ink/50 bg-paper/80",
                wrongFlash[i] && "candy border-ink [--candy:var(--destructive)] text-destructive-foreground",
                status === "correct" && "candy border-ink [--candy:var(--success)] text-success-foreground",
                locked[i] && status === "playing" && "ring-4 ring-sunny",
              )}
            >
              <AnimatePresence mode="popLayout">
                {tile && (
                  <motion.span
                    key={tile.id}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="text-sticker [-webkit-text-stroke:1.5px_var(--ink)] [text-shadow:0_3px_0_var(--ink)]"
                  >
                    {tile.letter}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </section>

      {/* Letter tray */}
      <section className="mx-auto mt-10 max-w-3xl rounded-[2.5rem] border-4 border-dashed border-ink/40 bg-paper/70 p-4 md:p-6">
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {tiles.map((t, i) =>
            usedIds.has(t.id) ? (
              <div
                key={t.id}
                className="h-16 w-16 rounded-2xl border-4 border-dashed border-ink/25 md:h-20 md:w-20"
              />
            ) : (
              <LetterTile
                key={t.id}
                tile={t}
                colorIndex={i}
                delay={i * 0.06}
                disabled={status !== "playing"}
                onPlace={placeTile}
              />
            ),
          )}
        </div>
        <p className="mt-3 text-center font-display text-base font-semibold text-muted-foreground">
          Tap a letter or drag it into a box
        </p>
      </section>

      <div className="mx-auto mt-6 flex max-w-5xl justify-center gap-3">
        <Button variant="candySun" size="big" onClick={giveHint} disabled={status !== "playing"}>
          <Lightbulb /> Hint
        </Button>
        <Mascot mood={mood} size="sm" className="md:hidden" />
      </div>

      <AnimatePresence>
        {status === "done" && (
          <EndCard
            key="done"
            title="Round complete!"
            emoji="🏆"
            stars={roundStars}
            streak={bestRunStreak}
            onRestart={onRestart}
            {...(nextLevel ? { nextLevel } : {})}
            totalStars={starsRef.current}
          />
        )}
        {status === "over" && (
          <EndCard
            key="over"
            title="Out of hearts!"
            subtitle={`The word was "${word.word}". You're getting better every try!`}
            emoji="💖"
            stars={roundStars}
            streak={bestRunStreak}
            onRestart={onRestart}
            totalStars={starsRef.current}
          />
        )}
        {newSticker && <StickerPopup key="sticker" sticker={newSticker} onClose={closeSticker} />}
      </AnimatePresence>
    </main>
  );
}

function LetterTile({
  tile,
  colorIndex,
  delay,
  disabled,
  onPlace,
}: {
  tile: Tile;
  colorIndex: number;
  delay: number;
  disabled: boolean;
  onPlace: (id: string, slot?: number) => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={`Letter ${tile.letter}`}
      disabled={disabled}
      drag={!disabled}
      dragSnapToOrigin
      dragElastic={0.9}
      whileDrag={{ scale: 1.25, rotate: 8, zIndex: 50 }}
      whileHover={{ scale: 1.1, rotate: -4 }}
      whileTap={{ scale: 0.9 }}
      initial={{ y: -40, opacity: 0, scale: 0.4 }}
      animate={{ y: [0, -8, 0], opacity: 1, scale: 1 }}
      transition={{
        y: { duration: 1.4 + (colorIndex % 3) * 0.2, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { delay },
        scale: { type: "spring", stiffness: 400, damping: 14, delay },
      }}
      onTap={() => onPlace(tile.id)}
      onDragEnd={(event) => {
        const e = event as PointerEvent;
        const hit = document
          .elementsFromPoint(e.clientX, e.clientY)
          .map((el) => (el as HTMLElement).closest<HTMLElement>("[data-slot-index]"))
          .find(Boolean);
        if (hit) onPlace(tile.id, Number(hit.dataset["slotIndex"]));
      }}
      className={cn(
        "candy relative flex h-16 w-16 touch-none cursor-grab items-center justify-center rounded-2xl border-4 border-ink font-display text-4xl font-bold uppercase active:cursor-grabbing md:h-20 md:w-20 md:text-5xl",
        tileColor(colorIndex),
      )}
    >
      <span className="text-sticker [-webkit-text-stroke:1.5px_var(--ink)] [text-shadow:0_3px_0_var(--ink)]">
        {tile.letter}
      </span>
    </motion.button>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="storybook-card w-full max-w-md p-6 text-center md:p-8"
        initial={{ scale: 0.3, rotate: -12, y: 80 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function EndCard({
  title,
  subtitle,
  emoji,
  stars,
  streak,
  onRestart,
  nextLevel,
  totalStars,
}: {
  title: string;
  subtitle?: string;
  emoji: string;
  stars: number;
  streak: number;
  onRestart: () => void;
  nextLevel?: Level;
  totalStars: number;
}) {
  useEffect(() => {
    if (stars > 0) {
      void import("canvas-confetti").then(({ default: confetti }) =>
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, scalar: 1.3 }),
      );
    }
  }, [stars]);
  const nextOpen = nextLevel && isLevelUnlocked(nextLevel, totalStars);
  return (
    <Overlay>
      <motion.div
        className="text-8xl"
        animate={{ rotate: [-8, 8, -8], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        {emoji}
      </motion.div>
      <h2 className="text-rainbow animate-rainbow mt-2 font-display text-5xl font-bold">{title}</h2>
      {subtitle && <p className="mt-2 font-display text-xl font-semibold text-ink">{subtitle}</p>}
      <div className="mt-5 flex justify-center gap-3">
        <div className="candy flex flex-col items-center rounded-3xl border-4 border-ink px-5 py-3 font-display text-ink [--candy:var(--sunny)]">
          <span className="text-4xl font-bold">⭐ {stars}</span>
          <span className="text-sm font-bold uppercase">stars</span>
        </div>
        <div className="candy flex flex-col items-center rounded-3xl border-4 border-ink px-5 py-3 font-display text-primary-foreground [--candy:var(--tangerine)]">
          <span className="text-4xl font-bold">🔥 {streak}</span>
          <span className="text-sm font-bold uppercase">best streak</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {nextLevel && nextOpen && (
          <Button asChild variant="candyGrass" size="big">
            <Link to="/play/$level" params={{ level: nextLevel.id }}>
              {nextLevel.emoji} Next: {nextLevel.name}
            </Link>
          </Button>
        )}
        {nextLevel && !nextOpen && (
          <p className="font-display text-lg font-semibold text-muted-foreground">
            <Lock className="mr-1 inline size-5" />
            {nextLevel.name} opens at {nextLevel.unlockAt} ⭐ — you have {totalStars}!
          </p>
        )}
        <Button variant="candyPink" size="big" onClick={onRestart}>
          <RotateCcw /> Play again
        </Button>
        <Button asChild variant="candyPaper" size="big">
          <Link to="/stickers">🎁 Sticker book</Link>
        </Button>
      </div>
    </Overlay>
  );
}

function StickerPopup({ sticker, onClose }: { sticker: Sticker; onClose: () => void }) {
  return (
    <Overlay>
      <p className="font-display text-2xl font-bold text-primary">New sticker unlocked!</p>
      <motion.div
        className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-full border-[5px] border-ink candy [--candy:var(--sunny)]"
        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <span className="text-[6.5rem] leading-none">{sticker.emoji}</span>
      </motion.div>
      <h2 className="mt-4 font-display text-4xl font-bold text-ink">{sticker.name}</h2>
      <Button variant="candyGrass" size="big" className="mt-6 w-full" onClick={onClose}>
        Yay! Keep going ▶
      </Button>
    </Overlay>
  );
}

function Loading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center">
      <Scenery />
      <Mascot message="Getting the letters ready…" />
    </main>
  );
}

function LockedScreen({ level }: { level: Level }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <Scenery />
      <div className="storybook-card max-w-md p-8 text-center">
        <div className="text-7xl">🔒</div>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">{level.name} is locked</h1>
        <p className="mt-2 font-display text-xl font-semibold text-muted-foreground">
          Collect {level.unlockAt} ⭐ to open it!
        </p>
        <Button asChild variant="candyGrass" size="big" className="mt-6">
          <Link to="/play/$level" params={{ level: "easy" }}>
            🌱 Play Sprout
          </Link>
        </Button>
      </div>
    </main>
  );
}
