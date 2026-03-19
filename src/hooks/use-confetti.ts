"use client";

import { useCallback, useRef } from "react";
import confetti from "canvas-confetti";

export function useConfetti() {
  const firedRef = useRef(false);

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const defaults = {
      spread: 60,
      ticks: 80,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 30,
      colors: [
        "#6186FF", // cornflower
        "#5F36F5", // violet
        "#C6DFFF", // sky blue
        "#f5f5f5", // white
        "#01B979", // emerald
      ],
    };

    confetti({ ...defaults, particleCount: 40, origin: { x: 0.3, y: 0.7 } });
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.7, y: 0.7 } });
  }, []);

  const reset = useCallback(() => {
    firedRef.current = false;
  }, []);

  return { fire, reset };
}
