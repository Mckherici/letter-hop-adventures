import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";
import fox from "@/assets/fox-mascot.png";
import { cn } from "@/lib/utils";

export type Mood = "idle" | "happy" | "sad" | "party";

const MOODS: Record<Mood, TargetAndTransition> = {
  idle: {
    y: [0, -10, 0],
    rotate: [-2, 2, -2],
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    y: [0, -70, 0, -30, 0],
    rotate: [0, -12, 12, -6, 0],
    scale: [1, 1.1, 1, 1.05, 1],
    transition: { duration: 1.1, ease: "easeOut" },
  },
  sad: {
    x: [0, -14, 14, -10, 10, 0],
    rotate: [0, -6, 6, -4, 0],
    transition: { duration: 0.6 },
  },
  party: {
    rotate: [0, 360],
    y: [0, -50, 0],
    scale: [1, 1.2, 1],
    transition: { duration: 1.2, ease: "easeInOut" },
  },
};

export function Mascot({
  mood = "idle",
  message,
  className,
  size = "md",
}: {
  mood?: Mood;
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "w-24 md:w-28",
    md: "w-32 md:w-40",
    lg: "w-48 md:w-64",
  }[size];

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, scale: 0.4, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="storybook-card relative mb-3 max-w-[14rem] rounded-3xl border-4 px-4 py-2 text-center font-display text-lg font-semibold leading-tight text-ink md:text-xl"
          >
            {message}
            <span className="absolute -bottom-3 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 border-b-4 border-r-4 border-ink bg-paper" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.img
        key={mood + (message ?? "")}
        src={fox}
        alt="Fizz the fox"
        width={1024}
        height={1024}
        animate={MOODS[mood]}
        className={cn("drop-shadow-xl select-none", sizeClass)}
        draggable={false}
      />
    </div>
  );
}
