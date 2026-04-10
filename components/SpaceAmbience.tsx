"use client";

import { useMemo } from "react";

type Star = {
  left: number;
  top: number;
  size: number;
  dur: number;
  delay: number;
};

/**
 * Lớp sao nhấp nháy / trôi rất nhẹ, không chặn click (pointer-events-none).
 * Bật tắt qua PageUiSettings.spaceEffectsEnabled.
 */
export function SpaceAmbience() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: ((i * 37 + 11) % 94) + 3,
        top: ((i * 29 + 5) % 88) + 4,
        size: 1 + (i % 3),
        dur: 3.2 + (i % 6) * 0.45,
        delay: (i % 12) * 0.22,
      })),
    []
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-[15] overflow-hidden"
      aria-hidden
    >
      <div className="space-aurora absolute inset-0 opacity-[0.35]" />
      {stars.map((s, i) => (
        <span
          key={i}
          className="space-star absolute rounded-full bg-teal-100/90 shadow-[0_0_6px_rgba(45,212,191,0.55)]"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
