// Rainbow tile colors; full literal class names so Tailwind keeps them.
export const TILE_COLORS = [
  "[--candy:var(--tile-1)] text-primary-foreground",
  "[--candy:var(--tile-2)] text-primary-foreground",
  "[--candy:var(--tile-3)] text-ink",
  "[--candy:var(--tile-4)] text-primary-foreground",
  "[--candy:var(--tile-5)] text-primary-foreground",
  "[--candy:var(--tile-6)] text-primary-foreground",
];

export function tileColor(index: number) {
  return TILE_COLORS[index % TILE_COLORS.length];
}
