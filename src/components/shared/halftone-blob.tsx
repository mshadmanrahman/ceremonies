import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface HalftonesBlobProps {
  variant?: "primary" | "coffee";
  size?: number;
  delay?: number;
  anim?: "a" | "b";
  className?: string;
}

export function HalftoneBlob({
  variant = "primary",
  size = 480,
  delay = 0,
  anim = "a",
  className,
}: HalftonesBlobProps) {
  const color =
    variant === "primary" ? "var(--color-primary)" : "var(--color-coffee)";
  const duration = anim === "a" ? "18s" : "22s";

  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `radial-gradient(circle, ${color} 1.5px, transparent 1.5px)`,
    backgroundSize: "10px 10px",
    WebkitMaskImage:
      "radial-gradient(ellipse at center, black 30%, transparent 72%)",
    maskImage: "radial-gradient(ellipse at center, black 30%, transparent 72%)",
    animation: `halftone-drift-${anim} ${duration} ease-in-out infinite`,
    animationDelay: `-${delay}s`,
    animationFillMode: "both",
  };

  return (
    <div
      className={cn("pointer-events-none absolute rounded-full", className)}
      style={style}
      aria-hidden="true"
    />
  );
}
