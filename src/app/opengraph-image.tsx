import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ceremonies - Open-source agile ceremony toolkit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a120b 0%, #2D1E14 50%, #1a120b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Dot grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Owl emoji as placeholder for mascot */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 16,
            display: "flex",
            gap: 24,
          }}
        >
          <span style={{ transform: "rotate(-6deg)" }}>🦉</span>
          <span style={{ transform: "rotate(6deg)" }}>👻</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          ceremonies
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Agile ceremonies, done right.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
          }}
        >
          {["Estimation", "Retros", "The Haunting"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255, 165, 50, 0.15)",
                border: "2px solid rgba(255, 165, 50, 0.4)",
                borderRadius: 4,
                padding: "8px 20px",
                fontSize: 18,
                fontWeight: 600,
                color: "#ffa532",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "rgba(255,255,255,0.35)",
            fontWeight: 500,
          }}
        >
          ceremonies.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
