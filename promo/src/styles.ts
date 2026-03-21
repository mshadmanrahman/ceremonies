// Design tokens matching the ceremonies app — LIGHT MODE
export const colors = {
  bg: "#f8f4ef", // warm cream
  bgCard: "#ffffff",
  bgSurface: "#f0ebe4",
  primary: "#c07d2a", // warm amber (slightly darker for light bg contrast)
  primaryBright: "#d4943a",
  coffee: "#8b6340",
  accent: "#4a6ee0", // cornflower (slightly deeper for light bg)
  text: "#1a120b", // dark warm brown
  textMuted: "rgba(26, 18, 11, 0.55)",
  textDim: "rgba(26, 18, 11, 0.3)",
  border: "#d4c8b8", // warm light border
  happy: "#16a34a", // deeper green for light bg
  sad: "#dc2626", // deeper red for light bg
  confused: "#ca8a04", // deeper yellow for light bg
  destructive: "#dc2626",
} as const;

export const fonts = {
  display: "Georgia, 'Times New Roman', serif", // fallback for Newsreader
  body: "system-ui, -apple-system, sans-serif", // fallback for Space Grotesk
  mono: "'Courier New', monospace", // fallback for Geist Mono
} as const;
