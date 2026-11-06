import { useCallback, useEffect, useState } from "react";

export interface Progress {
  totalStars: number;
  bestStreak: number;
  wordsSpelled: number;
}

const KEY = "spelling-safari-progress-v1";
const EMPTY: Progress = { totalStars: 0, bestStreak: 0, wordsSpelled: 0 };

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    return EMPTY;
  }
}

/** Saved progress on this device. `ready` is false until it has loaded in the browser. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(read());
    setReady(true);
  }, []);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage full or blocked — keep playing */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => update(() => EMPTY), [update]);

  return { progress, ready, update, reset };
}
