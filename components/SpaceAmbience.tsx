"use client";

import { useMemo } from "react";

type Star = {
  left: number;
  top: number;
  size: number;
  dur: number;
  delay: number;
  bright: boolean;
};

type Meteor = {
  id: number;
  topPct: number;
  delay: string;
  duration: string;
  leftStart: string;
};

/**
 * Sao nhấp nháy, tinh vân, sao băng — không chặn click.
 * Bật tắt qua PageUiSettings.spaceEffectsEnabled.
 */
export function SpaceAmbience() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 96 }, (_, i) => ({
        left: ((i * 37 + 11) % 96) + 2,
        top: ((i * 29 + 5) % 92) + 3,
        size: 1 + (i % 4),
        dur: 2.4 + (i % 8) * 0.38,
        delay: (i % 14) * 0.19,
        bright: i % 5 === 0 || i % 7 === 0,
      })),
    []
  );

  const meteors = useMemo<Meteor[]>(
    () => [
      { id: 0, topPct: 12, delay: "0s", duration: "4.2s", leftStart: "-8%" },
      { id: 1, topPct: 28, delay: "2.1s", duration: "5s", leftStart: "15%" },
      { id: 2, topPct: 8, delay: "5.4s", duration: "4.8s", leftStart: "40%" },
      { id: 3, topPct: 38, delay: "8s", duration: "5.5s", leftStart: "-5%" },
      { id: 4, topPct: 18, delay: "11s", duration: "4.5s", leftStart: "60%" },
    ],
    []
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      aria-hidden
    >
      <div className="space-aurora space-aurora-pulse absolute inset-0 opacity-[0.72]" />
      <div className="space-dust absolute inset-0 opacity-[0.55]" />

      {meteors.map((m) => (
        <span
          key={m.id}
          className="space-meteor absolute block h-px w-24 rounded-full sm:w-32"
          style={{
            top: `${m.topPct}%`,
            left: m.leftStart,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}

      {stars.map((s, i) => (
        <span
          key={i}
          className={
            s.bright
              ? "space-star space-star-bright absolute rounded-full bg-white shadow-[0_0_10px_rgba(165,243,252,0.95),0_0_20px_rgba(56,189,248,0.45)]"
              : "space-star absolute rounded-full bg-cyan-100/95 shadow-[0_0_7px_rgba(34,211,238,0.75)]"
          }
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.bright ? s.size + 1 : s.size,
            height: s.bright ? s.size + 1 : s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
