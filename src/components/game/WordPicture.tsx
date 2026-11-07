import { useEffect, useState } from "react";
import { pictureFor } from "@/lib/wordPictures";

/** Colourful backup drawing (rainbow, sun, clouds) shown if a word picture can't load. */
function FallbackArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      <circle cx="150" cy="55" r="26" fill="var(--sunny)" />
      {["var(--tile-1)", "var(--tile-2)", "var(--tile-3)", "var(--tile-4)", "var(--tile-5)", "var(--tile-6)"].map(
        (c, i) => (
          <path
            key={c}
            d={`M ${25 + i * 10} 150 A ${75 - i * 10} ${75 - i * 10} 0 0 1 ${175 - i * 10} 150`}
            fill="none"
            stroke={c}
            strokeWidth="10"
            strokeLinecap="round"
          />
        ),
      )}
      <g fill="var(--paper)" stroke="var(--ink)" strokeWidth="4">
        <ellipse cx="40" cy="152" rx="30" ry="18" />
        <ellipse cx="160" cy="152" rx="30" ry="18" />
      </g>
      <path
        d="M100 92 l6 14 15 2 -11 10 3 15 -13 -8 -13 8 3 -15 -11 -10 15 -2z"
        fill="var(--sunny)"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WordPicture({ word, className }: { word: string; className?: string }) {
  const src = pictureFor(word);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [word]);

  if (!src || failed) {
    return (
      <div role="img" aria-label={word} className={className}>
        <FallbackArt />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={word}
      draggable={false}
      onError={() => setFailed(true)}
      className={`${className ?? ""} object-contain`}
    />
  );
}
