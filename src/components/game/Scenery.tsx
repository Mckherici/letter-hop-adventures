import hills from "@/assets/storybook-hills.jpg";

const SPARKLES = [
  { top: "12%", left: "8%", delay: "0s", size: "text-3xl" },
  { top: "22%", left: "88%", delay: "0.6s", size: "text-4xl" },
  { top: "48%", left: "4%", delay: "1.2s", size: "text-2xl" },
  { top: "60%", left: "93%", delay: "0.3s", size: "text-3xl" },
  { top: "8%", left: "55%", delay: "1.6s", size: "text-2xl" },
  { top: "35%", left: "70%", delay: "0.9s", size: "text-xl" },
];

/** Full-screen storybook background with drifting balloons and twinkles. */
export function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={hills}
        alt=""
        width={1920}
        height={1088}
        className="h-full w-full object-cover object-bottom"
      />
      <div className="absolute inset-0 bg-sky-wash" />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className={`absolute animate-twinkle ${s.size}`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          ✨
        </span>
      ))}
      <span
        className="absolute top-[18%] animate-drift text-5xl"
        style={{ animationDuration: "34s" }}
      >
        🎈
      </span>
      <span
        className="absolute top-[40%] animate-drift text-4xl"
        style={{ animationDuration: "46s", animationDelay: "-20s" }}
      >
        🦋
      </span>
    </div>
  );
}
