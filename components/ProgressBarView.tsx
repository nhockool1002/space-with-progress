"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import type { ProgressConfig } from "@/lib/progress-storage";
import { getStepSummary, loadConfig, saveConfig } from "@/lib/progress-storage";
import { loadUiSettings, type PageUiSettings } from "@/lib/ui-settings";
import { FireworksOverlay } from "@/components/FireworksOverlay";

type Props = {
  refreshKey?: number;
};

export function ProgressBarView({ refreshKey = 0 }: Props) {
  const [config, setConfig] = useState<ProgressConfig | null>(null);
  const [ui, setUi] = useState<PageUiSettings | null>(null);

  const refresh = useCallback(() => {
    setConfig(loadConfig());
    setUi(loadUiSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const selectStep = useCallback((index: number) => {
    setConfig((c) => {
      if (!c || index < 0 || index >= c.steps.length) return c;
      if (index < c.completedCount) return c;
      const next = { ...c, activeStepIndex: index };
      saveConfig(next);
      return next;
    });
  }, []);

  const completeStep = useCallback(() => {
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
  }, []);

  const resetProgress = useCallback(() => {
    setConfig((c) => {
      if (!c) return c;
      const next = { ...c, completedCount: 0, activeStepIndex: 0 };
      saveConfig(next);
      return next;
    });
  }, []);

  if (!config || !ui) {
    return (
      <div className="text-sm text-slate-500">
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
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-4 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-teal-600">
              {ui.panelEyebrow}
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {ui.panelTitle}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <p className="max-w-[20rem] text-right text-[0.65rem] leading-snug text-slate-500">
              {ui.panelHint}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={completeStep}
                disabled={!canComplete}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {"Ho\u00e0n th\u00e0nh b\u01b0\u1edbc"}
              </button>
              <button
                type="button"
                onClick={resetProgress}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {"Reset ti\u1ebfn \u0111\u1ed9"}
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-30 mb-4 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-2.5 text-center shadow-sm">
          <p className="text-[0.7rem] leading-relaxed text-slate-700">
            {"\u0110\u00e3 ho\u00e0n th\u00e0nh"}{" "}
            <span className="font-mono font-semibold text-emerald-600">
              {completedCount}
            </span>
            <span className="text-slate-500">/{n}</span>
            {" \u00b7 Ch\u1ecdn t\u1edbi m\u1ed1c ch\u01b0a kh\u00f3a"}
          </p>
        </div>

        <div className="relative z-0 mb-6 min-h-[5.25rem] isolate px-1 pt-1 sm:min-h-[5.75rem] sm:px-2">
          <div
            className="pointer-events-none absolute left-[4%] right-[4%] top-[60%] h-3.5 -translate-y-1/2 overflow-hidden rounded-full border border-slate-300/90 bg-slate-200/90 shadow-[inset_0_2px_6px_rgba(15,23,42,0.08)]"
            aria-hidden
          >
            <div
              className="track-fill-done h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-500 shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-[width] duration-700 ease-out"
              style={{
                width: `${fillWidthPercent}%`,
                minWidth: fillWidthPercent > 0 ? "4px" : undefined,
              }}
            />
          </div>
          <div
            className="pointer-events-none absolute left-[4%] right-[4%] top-[60%] h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-400/40 to-transparent"
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
                    className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100 text-[0.55rem] font-bold leading-none text-emerald-800 shadow-[0_0_10px_rgba(52,211,153,0.35)]"
                    aria-hidden
                  >
                    {"\u2713"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectStep(i)}
                    aria-label={`Mốc ${i + 1}: ${getStepSummary(step)}`}
                    aria-current={isActive ? "step" : undefined}
                    className="flex cursor-pointer items-center justify-center outline-none"
                  >
                    <span
                      className={
                        "h-3.5 w-3.5 rounded-full border-2 bg-white shadow-md transition-all duration-300 " +
                        (isActive
                          ? "scale-125 border-amber-400 bg-amber-100 shadow-amber-200/80"
                          : "border-slate-400 hover:border-teal-500 hover:bg-teal-50/80")
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
                "left 0.7s cubic-bezier(0.34, 1.15, 0.64, 1), transform 0.35s ease",
            }}
          >
            <div className="ship-motion flex flex-col items-center">
              <Image
                src="/spaceship.png"
                alt=""
                width={56}
                height={56}
                className="h-12 w-12 rotate-90 object-contain drop-shadow-[0_0_18px_rgba(251,146,60,0.65)] sm:h-14 sm:w-14"
                priority
              />
              <span
                className="ship-flame mt-0.5 h-2 w-4 rounded-full bg-gradient-to-b from-amber-300 to-orange-600 opacity-95 blur-[1.5px]"
                aria-hidden
              />
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
                    className="step-card-tint pointer-events-none absolute inset-0 opacity-[0.1]"
                    style={tintStyle}
                    aria-hidden
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-transparent" />
                <div className="relative flex min-h-0 flex-col gap-1.5 p-2.5 sm:p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[0.65rem] font-medium leading-tight tracking-wide text-teal-700">
                      {step.time || "—"}
                    </span>
                    <span
                      className={
                        "shrink-0 rounded px-1 py-0.5 font-mono text-[0.55rem] tabular-nums " +
                        (done
                          ? "bg-emerald-100 text-emerald-800"
                          : isActive
                            ? "bg-amber-100 text-amber-900"
                            : "bg-slate-100 text-slate-600")
                      }
                    >
                      {done ? "\u2713" : String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-left text-[0.78rem] font-normal leading-snug text-slate-800 sm:text-[0.82rem]">
                    {step.title}
                  </p>
                  <p className="text-[0.55rem] text-slate-500">
                    Mốc {i + 1}/{n}
                    {done ? " \u00b7 \u0110\u00e3 xong" : ""}
                  </p>
                </div>
              </>
            );

            const cardClass =
              "group relative flex min-h-[5.75rem] flex-col overflow-hidden rounded-xl border text-left outline-none transition " +
              (done
                ? "cursor-not-allowed border-emerald-200 bg-emerald-50/80 "
                : "border-slate-200 bg-slate-50/90 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-teal-400/60 ") +
              (isActive && !done
                ? "ring-2 ring-amber-300/80 shadow-sm shadow-amber-100 "
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

      <div className="rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-center shadow-sm sm:px-5">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {"B\u01b0\u1edbc hi\u1ec7n t\u1ea1i"}
        </p>
        <p className="mt-1.5 text-sm font-medium leading-snug text-slate-900 sm:text-base">
          {allDone ? (
            <span className="text-emerald-600">
              {"\u0110\u00e3 ho\u00e0n th\u00e0nh to\u00e0n b\u1ed9 l\u1ecbch"}
            </span>
          ) : active ? (
            <>
              {active.time && (
                <span className="mr-2 font-mono text-xs text-teal-700 sm:text-sm">
                  {active.time}
                </span>
              )}
              <span>{active.title}</span>
            </>
          ) : (
            "—"
          )}
        </p>
        <p className="mt-1 text-[0.65rem] text-slate-500">
          {activeStepIndex + 1} / {n}
        </p>
      </div>

      <FireworksOverlay active={allDone} />
    </div>
  );
}
