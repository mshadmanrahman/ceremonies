// Design tokens matching the ceremonies app
export const colors = {
  bg: "#1a120b",
  bgCard: "#251a10",
  bgSurface: "#2D1E14",
  primary: "#d4943a", // warm amber
  primaryBright: "#f0a848",
  coffee: "#a67c52",
  accent: "#6186ff", // cornflower
  text: "#f5f0eb",
  textMuted: "rgba(245, 240, 235, 0.5)",
  textDim: "rgba(245, 240, 235, 0.3)",
  border: "#2D1E14",
  happy: "#4ade80",
  sad: "#f87171",
  confused: "#facc15",
  destructive: "#ef4444",
} as const;

export const fonts = {
  display: "Georgia, 'Times New Roman', serif", // fallback for Newsreader
  body: "system-ui, -apple-system, sans-serif", // fallback for Space Grotesk
  mono: "'Courier New', monospace", // fallback for Geist Mono
} as const;
