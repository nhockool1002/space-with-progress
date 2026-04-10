"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgressConfig } from "@/lib/progress-storage";
import { getStepSummary, loadConfig, saveConfig } from "@/lib/progress-storage";
import { loadUiSettings, type PageUiSettings } from "@/lib/ui-settings";
import { FireworksOverlay } from "@/components/FireworksOverlay";

type Props = {
  refreshKey?: number;
};

export function ProgressBarView({ refreshKey = 0 }: Props) {
  const SHIP_TURN_MS = 320;
  const SHIP_MOVE_MS = 1750;
  const [config, setConfig] = useState<ProgressConfig | null>(null);
  const [ui, setUi] = useState<PageUiSettings | null>(null);
  const [shipThrust, setShipThrust] = useState(false);
  const [shipFacing, setShipFacing] = useState<"forward" | "backward">(
    "forward"
  );
  const [isShipManeuvering, setIsShipManeuvering] = useState(false);
  const prevActiveStepRef = useRef<number | null>(null);
  const turnTimerRef = useRef<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const restoreTimerRef = useRef<number | null>(null);

  const refresh = useCallback(() => {
    setConfig(loadConfig());
    setUi(loadUiSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  useEffect(() => {
    if (!config) return;
    const idx = config.activeStepIndex;
    if (prevActiveStepRef.current === null) {
      prevActiveStepRef.current = idx;
      return;
    }
    if (prevActiveStepRef.current === idx) return;
    prevActiveStepRef.current = idx;
    setShipThrust(true);
    const t = window.setTimeout(() => setShipThrust(false), 1950);
    return () => window.clearTimeout(t);
  }, [config]);

  const clearShipTimers = useCallback(() => {
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    if (restoreTimerRef.current !== null) {
      window.clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearShipTimers();
    };
  }, [clearShipTimers]);

  const selectStep = useCallback((index: number) => {
    if (!config || isShipManeuvering) return;
    if (index < 0 || index >= config.steps.length) return;
    if (index < config.completedCount || index === config.activeStepIndex) return;

    const isBackwardMove = index < config.activeStepIndex;
    if (!isBackwardMove) {
      setShipFacing("forward");
      setConfig((c) => {
        if (!c || index < 0 || index >= c.steps.length) return c;
        if (index < c.completedCount) return c;
        const next = { ...c, activeStepIndex: index };
        saveConfig(next);
        return next;
      });
      return;
    }

    clearShipTimers();
    setIsShipManeuvering(true);
    setShipThrust(true);
    setShipFacing("backward");

    turnTimerRef.current = window.setTimeout(() => {
      setConfig((c) => {
        if (!c || index < 0 || index >= c.steps.length) return c;
        if (index < c.completedCount) return c;
        const next = { ...c, activeStepIndex: index };
        saveConfig(next);
        return next;
      });

      moveTimerRef.current = window.setTimeout(() => {
        setShipFacing("forward");
        restoreTimerRef.current = window.setTimeout(() => {
          setShipThrust(false);
          setIsShipManeuvering(false);
        }, SHIP_TURN_MS);
      }, SHIP_MOVE_MS);
    }, SHIP_TURN_MS);
  }, [SHIP_MOVE_MS, SHIP_TURN_MS, clearShipTimers, config, isShipManeuvering]);

  const completeStep = useCallback(() => {
    if (isShipManeuvering) return;
    setConfig((c) => {
      if (!c) return c;
      const n = c.steps.length;
      if (c.completedCount >= n) return c;
      if (c.activeStepIndex !== c.completedCount) return c;
      const completedCount = c.completedCount + 1;
      const activeStepIndex = completedCount >= n ? n - 1 : completedCount;
      const next = { ...c, completedCount, activeStepIndex };
      saveConfig(next);
      return next;
    });
  }, [isShipManeuvering]);

  const resetProgress = useCallback(() => {
    if (!config || isShipManeuvering) return;

    // Nếu đã ở mốc đầu thì reset tức thì.
    if (config.activeStepIndex <= 0) {
      clearShipTimers();
      setShipFacing("forward");
      setShipThrust(false);
      setIsShipManeuvering(false);
      setConfig((c) => {
        if (!c) return c;
        const next = { ...c, completedCount: 0, activeStepIndex: 0 };
        saveConfig(next);
        return next;
      });
      return;
    }

    clearShipTimers();
    setIsShipManeuvering(true);
    setShipThrust(true);
    setShipFacing("backward");

    turnTimerRef.current = window.setTimeout(() => {
      setConfig((c) => {
        if (!c) return c;
        const next = { ...c, completedCount: 0, activeStepIndex: 0 };
        saveConfig(next);
        return next;
      });

      moveTimerRef.current = window.setTimeout(() => {
        setShipFacing("forward");
        restoreTimerRef.current = window.setTimeout(() => {
          setShipThrust(false);
          setIsShipManeuvering(false);
        }, SHIP_TURN_MS);
      }, SHIP_MOVE_MS);
    }, SHIP_TURN_MS);
  }, [
    SHIP_MOVE_MS,
    SHIP_TURN_MS,
    clearShipTimers,
    config,
    isShipManeuvering,
  ]);

  if (!config || !ui) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {"\u0110ang t\u1ea3i\u2026"}
      </div>
    );
  }

  const { steps, activeStepIndex, completedCount } = config;
  const n = steps.length;
  /** % theo container cha (cùng hệ với mốc / tàu) */
  const shipLeftPercent = n > 0 ? ((activeStepIndex + 0.5) / n) * 100 : 50;
  const active = steps[activeStepIndex];
  const canComplete =
    n > 0 && completedCount < n && activeStepIndex === completedCount;
  const allDone = n > 0 && completedCount >= n;
  /** Track có inset trái/phải 4% — fill là % chiều rộng *trong* track, phải quy đổi từ shipLeftPercent */
  const TRACK_INSET_PCT = 4;
  const trackInnerSpan = 100 - 2 * TRACK_INSET_PCT;
  const fillWidthPercent =
    n === 0
      ? 0
      : allDone
        ? 100
        : Math.max(
            0,
            Math.min(
              100,
              ((shipLeftPercent - TRACK_INSET_PCT) / trackInnerSpan) * 100
            )
          );

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,1)] dark:border-slate-600/90 dark:bg-slate-900 dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-600/80">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              {ui.panelEyebrow}
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
              {ui.panelTitle}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <p className="max-w-[20rem] text-right text-[0.65rem] leading-snug text-slate-500 dark:text-slate-400">
              {ui.panelHint}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={completeStep}
                disabled={!canComplete || isShipManeuvering}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {"Ho\u00e0n th\u00e0nh b\u01b0\u1edbc"}
              </button>
              <button
                type="button"
                onClick={resetProgress}
                disabled={isShipManeuvering}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {"Reset ti\u1ebfn \u0111\u1ed9"}
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-30 mb-4 rounded-xl border border-sky-300/90 bg-sky-100 px-4 py-2.5 text-center shadow-sm dark:border-sky-700/80 dark:bg-sky-950/60 dark:shadow-sky-950/20">
          <p className="text-[0.7rem] font-medium leading-relaxed text-slate-800 dark:text-slate-200">
            {allDone ? (
              <span className="font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {"HO\u00c0N TH\u00c0NH M\u1ee4C TI\u00caU"}
              </span>
            ) : (
              <>
                {"\u0110\u00e3 ho\u00e0n th\u00e0nh"}{" "}
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {completedCount}
                </span>
                <span className="text-slate-500 dark:text-slate-400">/{n}</span>
                {" \u00b7 Ch\u1ecdn t\u1edbi m\u1ed1c ch\u01b0a kh\u00f3a"}
              </>
            )}
          </p>
        </div>

        <div className="relative z-0 mb-6 min-h-[5.25rem] isolate px-1 pb-12 pt-1 sm:min-h-[5.75rem] sm:px-2">
          <div
            className="pointer-events-none absolute left-[4%] right-[4%] top-[60%] h-3.5 -translate-y-1/2 overflow-hidden rounded-full border border-slate-300 bg-slate-200 shadow-[inset_0_2px_8px_rgba(15,23,42,0.12)] dark:border-slate-600 dark:bg-slate-800 dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.35)]"
            aria-hidden
          >
            <div className="track-rainbow-bg absolute inset-0" />
            <div
              className="track-fill-done relative h-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-500 shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-[width] duration-[1150ms] ease-out"
              style={{
                width: `${fillWidthPercent}%`,
                minWidth: fillWidthPercent > 0 ? "4px" : undefined,
              }}
            >
              <div className="track-fill-rainbow absolute inset-0" />
            </div>
          </div>
          <div
            className="pointer-events-none absolute left-[4%] right-[4%] top-[60%] h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-400/40 to-transparent dark:via-slate-500/25"
            aria-hidden
          />

          {steps.map((step, i) => {
            const done = i < completedCount;
            const isActive = i === activeStepIndex;
            return (
              <div
                key={`dot-${step.id}`}
                className="absolute top-[60%] z-[5] flex -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${((i + 0.5) / n) * 100}%` }}
              >
                {done ? (
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100 text-[0.55rem] font-bold leading-none text-emerald-800 shadow-[0_0_10px_rgba(52,211,153,0.35)] dark:border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200"
                    aria-hidden
                  >
                    {"\u2713"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectStep(i)}
                    disabled={isShipManeuvering}
                    aria-label={`Mốc ${i + 1}: ${getStepSummary(step)}`}
                    aria-current={isActive ? "step" : undefined}
                    className="flex cursor-pointer items-center justify-center outline-none disabled:cursor-not-allowed"
                  >
                    <span
                      className={
                        "h-3.5 w-3.5 rounded-full border-2 bg-white shadow-md transition-all duration-300 dark:bg-slate-800 " +
                        (isActive
                          ? "scale-125 border-amber-400 bg-amber-100 shadow-amber-200/80 dark:bg-amber-950/60 dark:shadow-amber-900/40"
                          : "border-slate-400 hover:border-teal-500 hover:bg-teal-50/80 dark:border-slate-500 dark:hover:border-teal-400 dark:hover:bg-teal-950/40")
                      }
                    />
                  </button>
                )}
              </div>
            );
          })}

          <div
            className="pointer-events-none absolute top-[60%] z-20 -translate-x-1/2 -translate-y-[62%] will-change-[left]"
            style={{
              left: `${shipLeftPercent}%`,
              transition:
                `left ${SHIP_MOVE_MS}ms cubic-bezier(0.34, 1.12, 0.64, 1), transform 0.5s ease`,
            }}
          >
            <div
              className={
                "ship-facing-wrap relative flex flex-col items-center " +
                (shipFacing === "backward"
                  ? "ship-facing-backward"
                  : "ship-facing-forward")
              }
            >
              <div
                className={
                  "ship-thrust-wrap ship-motion relative flex flex-col items-center " +
                  (shipThrust ? "ship-thrust-active" : "")
                }
                style={
                  {
                    "--flame-a": ui.flameColorA,
                    "--flame-b": ui.flameColorB,
                  } as CSSProperties
                }
              >
                <span className="ship-fire-bloom" aria-hidden />
                <span className="ship-smoke ship-smoke-1" aria-hidden />
                <span className="ship-smoke ship-smoke-2" aria-hidden />
                <span className="ship-smoke ship-smoke-3" aria-hidden />
                <span className="ship-smoke ship-smoke-4" aria-hidden />
                <span className="ship-smoke ship-smoke-5" aria-hidden />
                <span className="ship-smoke ship-smoke-6" aria-hidden />
                <span className="ship-smoke-dark ship-smoke-d1" aria-hidden />
                <span className="ship-smoke-dark ship-smoke-d2" aria-hidden />
                <span className="ship-spark ship-spark-1" aria-hidden />
                <span className="ship-spark ship-spark-2" aria-hidden />
                <span className="ship-spark ship-spark-3" aria-hidden />
                <span className="ship-spark ship-spark-4" aria-hidden />
                <span className="ship-fire-glow" aria-hidden />
                <Image
                  src={ui.spaceshipImage || "/spaceship.png"}
                  alt=""
                  width={56}
                  height={56}
                  className="ship-thrust-glow-target relative z-[2] h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
                  priority
                />
                <div
                  className="ship-tail-streaks pointer-events-none relative z-[1] mt-0.5 h-8 w-16 shrink-0 sm:h-9 sm:w-[4.5rem]"
                  aria-hidden
                >
                  <span className="ship-tail-streak ship-tail-streak-1" />
                  <span className="ship-tail-streak ship-tail-streak-2" />
                  <span className="ship-tail-streak ship-tail-streak-3" />
                  <span className="ship-tail-streak ship-tail-streak-4" />
                  <span className="ship-tail-streak ship-tail-streak-5" />
                </div>
                <span
                  className="ship-flame relative z-[2] mt-0.5 h-2 w-4 rounded-full opacity-95 blur-[1.5px]"
                  aria-hidden
                />
                <span className="ship-flame-extra" aria-hidden />
                <span className="ship-fire-core" aria-hidden />
                <span className="ship-fire-plume" aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => {
            const isActive = i === activeStepIndex;
            const done = i < completedCount;
            const tintStyle = {
              "--c-a": step.colorA,
              "--c-b": step.colorB,
            } as CSSProperties;
            const canSelect = !done;

            const inner = (
              <>
                <span
                  className="step-card-tint pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80"
                  style={tintStyle}
                  aria-hidden
                />
                {!done && (
                  <div
                    className="step-card-tint pointer-events-none absolute inset-0 opacity-[0.28]"
                    style={tintStyle}
                    aria-hidden
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/28 to-transparent dark:from-white/[0.07]" />
                <div className="relative flex min-h-0 flex-col gap-1.5 p-2.5 sm:p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[0.65rem] font-medium leading-tight tracking-wide text-teal-700 dark:text-teal-400">
                      {step.time || "—"}
                    </span>
                    <span
                      className={
                        "shrink-0 rounded px-1 py-0.5 font-mono text-[0.55rem] tabular-nums " +
                        (done
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200"
                          : isActive
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300")
                      }
                    >
                      {done ? "\u2713" : String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p
                    className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.78rem] font-normal leading-snug text-slate-800 dark:text-slate-100 sm:text-[0.82rem]"
                    title={step.title}
                  >
                    {step.title}
                  </p>
                  <p className="text-[0.55rem] text-slate-500 dark:text-slate-400">
                    Mốc {i + 1}/{n}
                    {done ? " \u00b7 \u0110\u00e3 xong" : ""}
                  </p>
                </div>
              </>
            );

            const cardClass =
              "group relative flex min-h-[5.75rem] flex-col overflow-hidden rounded-xl border text-left outline-none transition " +
              (done
                ? "cursor-not-allowed border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/35 "
                : "border-slate-300/90 bg-white hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500/70 dark:border-slate-600 dark:bg-slate-800/90 dark:hover:border-slate-500 dark:focus-visible:ring-teal-400/50 ") +
              (isActive && !done
                ? "ring-2 ring-amber-400 shadow-md shadow-amber-200/90 dark:shadow-amber-950/40 "
                : "");

            if (done) {
              return (
                <div
                  key={step.id}
                  className={cardClass}
                  aria-label={`Đã hoàn thành: ${getStepSummary(step)}`}
                >
                  {inner}
                </div>
              );
            }

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => canSelect && selectStep(i)}
                aria-pressed={isActive}
                aria-label={`B\u01b0\u1edbc ${i + 1}: ${getStepSummary(step)}`}
                className={cardClass}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-center shadow-md shadow-slate-900/8 dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/25 sm:px-5">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          {"B\u01b0\u1edbc hi\u1ec7n t\u1ea1i"}
        </p>
        <p className="mt-1.5 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100 sm:text-base">
          {allDone ? (
            <span className="text-emerald-600">
              {"\u0110\u00e3 ho\u00e0n th\u00e0nh to\u00e0n b\u1ed9 l\u1ecbch"}
            </span>
          ) : active ? (
            <>
              {active.time && (
                <span className="mr-2 font-mono text-xs text-teal-700 dark:text-teal-400 sm:text-sm">
                  {active.time}
                </span>
              )}
              <span className="[overflow-wrap:anywhere]">{active.title}</span>
            </>
          ) : (
            "—"
          )}
        </p>
        <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400">
          {activeStepIndex + 1} / {n}
        </p>
      </div>

      <FireworksOverlay active={allDone} />
    </div>
  );
}
