// Design tokens matching the ceremonies app — LIGHT MODE
// Sampled from live site: oklch values → computed hex
export const colors = {
  bg: "#f6f1e9", // warm cream
  bgCard: "#fdfbf9",
  bgSurface: "#f0ebe4",
  primary: "#f77f00", // THE orange — oklch(0.72 0.18 55)
  primaryBright: "#ff9020",
  coffee: "#884c1e",
  accent: "#5a66c7", // cornflower
  text: "#0e0300", // near-black warm
  textMuted: "#625245",
  textDim: "rgba(14, 3, 0, 0.25)",
  border: "#2D1E14", // dark warm brown border (same as app)
  happy: "#008e3e",
  sad: "#dc2626",
  confused: "#d17236",
  destructive: "#dc2626",
} as const;

export const fonts = {
  display: "'Newsreader', Georgia, 'Times New Roman', serif",
  body: "'Space Grotesk', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', 'Courier New', monospace",
} as const;

/**
 * Google Fonts CSS import URLs.
 * Inject these in Remotion compositions to load the actual website fonts.
 */
export const fontImports = [
  "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,700&display=swap",
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
] as const;
