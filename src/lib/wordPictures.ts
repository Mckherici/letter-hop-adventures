// Maps every spelling word to its own cartoon picture file (stored as a CDN asset pointer).

const pointers = import.meta.glob<{ url: string }>("../assets/words/*.png.asset.json", {
  eager: true,
  import: "default",
});

const byWord: Record<string, string> = {};
for (const [path, pointer] of Object.entries(pointers)) {
  const name = path.split("/").pop()?.replace(".png.asset.json", "");
  if (name && pointer?.url) byWord[name] = pointer.url;
}

/** Picture URL for a word, or undefined if none exists. */
export function pictureFor(word: string): string | undefined {
  return byWord[word.toLowerCase()];
}
