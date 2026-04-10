"use client";

import { useEffect, useRef } from "react";

type Props = {
  active: boolean;
};

/** Pháo hoa overlay trong suốt; mỗi frame clearRect (tránh cộng dồn lớp sáng che UI). */
export function FireworksOverlay({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      color: string;
      size: number;
    };
    const particles: Particle[] = [];
    const colors = [
      "#fbbf24",
      "#f472b6",
      "#34d399",
      "#60a5fa",
      "#a78bfa",
      "#fb923c",
      "#f87171",
      "#fef08a",
    ];

    function burst(cx: number, cy: number) {
      const count = 36 + Math.floor(Math.random() * 28);
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const sp = 1.8 + Math.random() * 5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          max: 55 + Math.random() * 50,
          color: colors[Math.floor(Math.random() * colors.length)]!,
          size: 1.2 + Math.random() * 2,
        });
      }
    }

    let lastBurst = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (now - lastBurst > 350 + Math.random() * 200) {
        lastBurst = now;
        burst(
          w * (0.15 + Math.random() * 0.7),
          h * (0.12 + Math.random() * 0.45)
        );
      }

      const dt = Math.min(40, now - last) / 16;
      last = now;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.life += dt;
        p.vy += 0.06 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const t = p.life / p.max;
        if (t >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = (1 - t) * (1 - t);
        ctx.globalAlpha = Math.min(1, alpha * 1.15);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };

    burst(canvas.width * 0.5, canvas.height * 0.35);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100] bg-transparent"
      aria-hidden
    />
  );
}
