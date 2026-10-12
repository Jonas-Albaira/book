export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) =>
      i > 0 && ["a", "an", "the", "of", "for", "and", "or", "to", "in", "on", "with", "over"].includes(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");

/** Reveals already-received text word by word, for a typing effect on non-streamed responses. */
export async function revealText(text: string, onChunk: (soFar: string) => void) {
  const words = text.split(/(\s+)/);
  let out = "";
  for (let i = 0; i < words.length; i++) {
    out += words[i];
    if (i % 8 === 0) {
      onChunk(out);
      await new Promise((r) => setTimeout(r, 12));
    }
  }
  onChunk(out);
}

export const COVER_PALETTES: Record<string, { bg: string; fg: string; accent: string }[]> = {
  nonfiction: [
    { bg: "#0f172a", fg: "#f8fafc", accent: "#f59e0b" },
    { bg: "#fef3c7", fg: "#1c1917", accent: "#b45309" },
    { bg: "#064e3b", fg: "#ecfdf5", accent: "#6ee7b7" },
    { bg: "#ffffff", fg: "#111827", accent: "#2563eb" },
    { bg: "#7c2d12", fg: "#fff7ed", accent: "#fdba74" },
    { bg: "#1e1b4b", fg: "#e0e7ff", accent: "#f472b6" },
  ],
  fiction: [
    { bg: "#0c0a09", fg: "#fafaf9", accent: "#dc2626" },
    { bg: "#172554", fg: "#dbeafe", accent: "#fbbf24" },
    { bg: "#3f6212", fg: "#f7fee7", accent: "#fef08a" },
    { bg: "#4c0519", fg: "#ffe4e6", accent: "#fda4af" },
    { bg: "#1f2937", fg: "#f3f4f6", accent: "#a78bfa" },
    { bg: "#f5f5f4", fg: "#292524", accent: "#9a3412" },
  ],
};
