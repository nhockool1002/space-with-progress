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

type LaserShot = {
  id: number;
  startPct: number;
  endPct: number;
  variant: "target" | "step" | "celebrate";
};

type ImpactBurst = {
  id: number;
  atPct: number;
};

type Shockwave = {
  id: number;
  atPct: number;
};

export function ProgressBarView({ refreshKey = 0 }: Props) {
  const SHIP_TURN_MS = 320;
  const SHIP_MOVE_MS = 1750;
  const LASER_SHOT_MS = 520;
  const LASER_HEAT_MAX = 100;
  const LASER_HEAT_PER_SHOT = 24;
  const LASER_HEAT_COOLDOWN_STEP = 10;
  const LASER_MIN_GAP_MS = 150;
  const [config, setConfig] = useState<ProgressConfig | null>(null);
  const [ui, setUi] = useState<PageUiSettings | null>(null);
  const [shipThrust, setShipThrust] = useState(false);
  const [shipFacing, setShipFacing] = useState<"forward" | "backward">(
    "forward"
  );
  const [isShipManeuvering, setIsShipManeuvering] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isShieldOn, setIsShieldOn] = useState(false);
  const [isHyperJumping, setIsHyperJumping] = useState(false);
  const [pulseLocked, setPulseLocked] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [nebulaPulse, setNebulaPulse] = useState(false);
  const [effectIntensity, setEffectIntensity] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [reduceMotion, setReduceMotion] = useState(false);
  const [laserShots, setLaserShots] = useState<LaserShot[]>([]);
  const [impactBursts, setImpactBursts] = useState<ImpactBurst[]>([]);
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [laserHeat, setLaserHeat] = useState(0);
  const prevActiveStepRef = useRef<number | null>(null);
  const prevAllDoneRef = useRef(false);
  const lastLaserAtRef = useRef(0);
  const laserSeqRef = useRef(0);
  const impactSeqRef = useRef(0);
  const shockSeqRef = useRef(0);
  const turnTimerRef = useRef<number | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const restoreTimerRef = useRef<number | null>(null);
  const laserTimersRef = useRef<number[]>([]);
  const actionTimersRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const refresh = useCallback(() => {
    setConfig(loadConfig());
    setUi(loadUiSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

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

  const clearLaserTimers = useCallback(() => {
    for (const timerId of laserTimersRef.current) {
      window.clearTimeout(timerId);
    }
    laserTimersRef.current = [];
  }, []);

  const clearActionTimers = useCallback(() => {
    for (const timerId of actionTimersRef.current) {
      window.clearTimeout(timerId);
    }
    actionTimersRef.current = [];
  }, []);

  const intensityScale =
    effectIntensity === "low" ? 0.75 : effectIntensity === "high" ? 1.28 : 1;

  const pulseScreenFlash = useCallback((durationMs = 180) => {
    setScreenFlash(true);
    const timer = window.setTimeout(() => setScreenFlash(false), durationMs);
    actionTimersRef.current.push(timer);
  }, []);

  const pulseNebula = useCallback((durationMs = 420) => {
    setNebulaPulse(true);
    const timer = window.setTimeout(() => setNebulaPulse(false), durationMs);
    actionTimersRef.current.push(timer);
  }, []);

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        // Safari
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }, []);

  const playLaserSound = useCallback(
    (isCelebration = false) => {
      if (!ui?.laserSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "triangle";
      const startHz = isCelebration ? 1280 : 940;
      const endHz = isCelebration ? 420 : 300;
      oscillator.frequency.setValueAtTime(startHz, now);
      oscillator.frequency.exponentialRampToValueAtTime(endHz, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.17);
    },
    [getAudioContext, ui?.laserSoundEnabled]
  );

  const playUiActionSound = useCallback(
    (kind: "boost" | "roll" | "pulse" | "shield-on" | "shield-off") => {
      if (!ui?.laserSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        void ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (kind === "boost") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(190, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.22);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.25);
        return;
      }

      if (kind === "roll") {
        osc.type = "square";
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(310, now + 0.08);
        osc.frequency.linearRampToValueAtTime(430, now + 0.16);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.04, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
        return;
      }

      if (kind === "pulse") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.exponentialRampToValueAtTime(270, now + 0.13);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
        return;
      }

      osc.type = "sine";
      if (kind === "shield-on") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.16);
      } else {
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);
    },
    [getAudioContext, ui?.laserSoundEnabled]
  );

  const spawnImpactBurst = useCallback(
    (atPct: number) => {
      const id = impactSeqRef.current++;
      setImpactBursts((prev) => [...prev, { id, atPct }]);
      const timer = window.setTimeout(
        () => setImpactBursts((prev) => prev.filter((b) => b.id !== id)),
        Math.floor((reduceMotion ? 220 : 340) * intensityScale)
      );
      actionTimersRef.current.push(timer);
    },
    [intensityScale, reduceMotion]
  );

  const spawnShockwave = useCallback(
    (atPct: number) => {
      const id = shockSeqRef.current++;
      setShockwaves((prev) => [...prev, { id, atPct }]);
      const timer = window.setTimeout(
        () => setShockwaves((prev) => prev.filter((w) => w.id !== id)),
        Math.floor((reduceMotion ? 260 : 520) * intensityScale)
      );
      actionTimersRef.current.push(timer);
    },
    [intensityScale, reduceMotion]
  );

  const emitLaserShot = useCallback(
    (
      startPct: number,
      endPct: number,
      variant: LaserShot["variant"],
      options?: { affectHeat?: boolean; withSound?: boolean }
    ) => {
      const affectHeat = options?.affectHeat !== false;
      const withSound = options?.withSound !== false;
      const now = Date.now();
      if (
        affectHeat &&
        (laserHeat >= LASER_HEAT_MAX || now - lastLaserAtRef.current < LASER_MIN_GAP_MS)
      ) {
        return false;
      }
      const id = laserSeqRef.current++;
      setLaserShots((prev) => [...prev, { id, startPct, endPct, variant }]);
      spawnImpactBurst(endPct);
      if (variant !== "step") {
        pulseScreenFlash(reduceMotion ? 90 : 140);
      }
      if (variant === "celebrate" || variant === "target") {
        pulseNebula(reduceMotion ? 220 : 360);
      }
      const rm = window.setTimeout(() => {
        setLaserShots((prev) => prev.filter((s) => s.id !== id));
      }, LASER_SHOT_MS);
      laserTimersRef.current.push(rm);
      if (affectHeat) {
        lastLaserAtRef.current = now;
        setLaserHeat((h) => Math.min(LASER_HEAT_MAX, h + LASER_HEAT_PER_SHOT));
      }
      if (withSound) playLaserSound(variant === "celebrate");
      return true;
    },
    [
      LASER_HEAT_MAX,
      LASER_HEAT_PER_SHOT,
      LASER_MIN_GAP_MS,
      LASER_SHOT_MS,
      laserHeat,
      pulseNebula,
      pulseScreenFlash,
      playLaserSound,
      reduceMotion,
      spawnImpactBurst,
    ]
  );

  useEffect(() => {
    if (!config) return;
    const idx = config.activeStepIndex;
    const n = config.steps.length;
    if (prevActiveStepRef.current === null) {
      prevActiveStepRef.current = idx;
      return;
    }
    const prevIdx = prevActiveStepRef.current;
    if (prevIdx === idx) return;
    prevActiveStepRef.current = idx;
    setShipThrust(true);
    if (n > 0) {
      const nowPct = ((idx + 0.5) / n) * 100;
      const toRight = idx >= prevIdx;
      const shotReach = 14;
      const endPct = toRight
        ? Math.min(100, nowPct + shotReach)
        : Math.max(0, nowPct - shotReach);
      void emitLaserShot(nowPct, endPct, "step", {
        affectHeat: true,
        withSound: true,
      });
    }
    const t = window.setTimeout(() => setShipThrust(false), 1950);
    return () => window.clearTimeout(t);
  }, [config, emitLaserShot]);

  useEffect(() => {
    return () => {
      clearShipTimers();
      clearLaserTimers();
      clearActionTimers();
    };
  }, [clearActionTimers, clearLaserTimers, clearShipTimers]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLaserHeat((h) => Math.max(0, h - LASER_HEAT_COOLDOWN_STEP));
    }, 220);
    return () => window.clearInterval(timer);
  }, [LASER_HEAT_COOLDOWN_STEP]);

  useEffect(() => {
    if (!config) return;
    const n = config.steps.length;
    const allDoneNow = n > 0 && config.completedCount >= n;
    if (allDoneNow && !prevAllDoneRef.current && n > 0) {
      const centerPct = ((config.activeStepIndex + 0.5) / n) * 100;
      const offsets = [-11, -6, -2, 3, 8, 12];
      offsets.forEach((offset, i) => {
        const timer = window.setTimeout(() => {
          const to = Math.max(0, Math.min(100, centerPct + offset));
          void emitLaserShot(centerPct, to, "celebrate", {
            affectHeat: false,
            withSound: true,
          });
        }, i * 90);
        laserTimersRef.current.push(timer);
      });
    }
    prevAllDoneRef.current = allDoneNow;
  }, [config, emitLaserShot]);

  const selectStep = useCallback((index: number) => {
    if (!config || isShipManeuvering) return;
    if (index < 0 || index >= config.steps.length) return;
    if (index < config.completedCount || index === config.activeStepIndex) return;

    const currentPct = ((config.activeStepIndex + 0.5) / config.steps.length) * 100;
    const targetPct = ((index + 0.5) / config.steps.length) * 100;
    const targetShotFired = emitLaserShot(currentPct, targetPct, "target", {
      affectHeat: true,
      withSound: true,
    });
    const preFireDelay = targetShotFired ? Math.floor(LASER_SHOT_MS * 0.85) : 0;
    const isBackwardMove = index < config.activeStepIndex;
    clearShipTimers();
    setIsShipManeuvering(true);
    setShipThrust(true);

    if (!isBackwardMove) {
      setShipFacing("forward");
      turnTimerRef.current = window.setTimeout(() => {
        setConfig((c) => {
          if (!c || index < 0 || index >= c.steps.length) return c;
          if (index < c.completedCount) return c;
          const next = { ...c, activeStepIndex: index };
          saveConfig(next);
          return next;
        });
        moveTimerRef.current = window.setTimeout(() => {
          setShipThrust(false);
          setIsShipManeuvering(false);
        }, SHIP_MOVE_MS);
      }, preFireDelay);
      return;
    }

    turnTimerRef.current = window.setTimeout(() => {
      setShipFacing("backward");
      moveTimerRef.current = window.setTimeout(() => {
        setConfig((c) => {
          if (!c || index < 0 || index >= c.steps.length) return c;
          if (index < c.completedCount) return c;
          const next = { ...c, activeStepIndex: index };
          saveConfig(next);
          return next;
        });
        restoreTimerRef.current = window.setTimeout(() => {
          setShipFacing("forward");
          turnTimerRef.current = window.setTimeout(() => {
            setShipThrust(false);
            setIsShipManeuvering(false);
          }, SHIP_TURN_MS);
        }, SHIP_MOVE_MS);
      }, SHIP_TURN_MS);
    }, preFireDelay);
  }, [
    LASER_SHOT_MS,
    SHIP_MOVE_MS,
    SHIP_TURN_MS,
    clearShipTimers,
    config,
    emitLaserShot,
    isShipManeuvering,
  ]);

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

  const triggerBoost = useCallback(() => {
    if (isShipManeuvering || isBoosting) return;
    playUiActionSound("boost");
    pulseScreenFlash(reduceMotion ? 80 : 120);
    setIsBoosting(true);
    setShipThrust(true);
    const timer = window.setTimeout(() => {
      setIsBoosting(false);
      if (!isShipManeuvering) setShipThrust(false);
    }, 920);
    actionTimersRef.current.push(timer);
  }, [isBoosting, isShipManeuvering, playUiActionSound, pulseScreenFlash, reduceMotion]);

  const triggerRoll = useCallback(() => {
    if (isShipManeuvering || isRolling) return;
    playUiActionSound("roll");
    setIsRolling(true);
    const timer = window.setTimeout(() => {
      setIsRolling(false);
    }, 920);
    actionTimersRef.current.push(timer);
  }, [isRolling, isShipManeuvering, playUiActionSound]);

  const triggerFirePulse = useCallback(() => {
    if (isShipManeuvering || pulseLocked || !config) return;
    playUiActionSound("pulse");
    const total = config.steps.length;
    if (total <= 0) return;
    const centerPct = ((config.activeStepIndex + 0.5) / total) * 100;
    spawnShockwave(centerPct);
    pulseScreenFlash(reduceMotion ? 90 : 130);
    pulseNebula(reduceMotion ? 240 : 420);
    const forwardDir = shipFacing === "backward" ? -1 : 1;
    const offsets = [9, 14, 19];
    offsets.forEach((reach, i) => {
      const timer = window.setTimeout(() => {
        const target = Math.max(0, Math.min(100, centerPct + reach * forwardDir));
        void emitLaserShot(centerPct, target, "step", {
          affectHeat: true,
          withSound: true,
        });
      }, i * 90);
      actionTimersRef.current.push(timer);
    });
    setPulseLocked(true);
    const unlock = window.setTimeout(() => setPulseLocked(false), 1400);
    actionTimersRef.current.push(unlock);
  }, [
    config,
    emitLaserShot,
    isShipManeuvering,
    playUiActionSound,
    pulseNebula,
    pulseScreenFlash,
    pulseLocked,
    reduceMotion,
    shipFacing,
    spawnShockwave,
  ]);

  const toggleShield = useCallback(() => {
    setIsShieldOn((v) => {
      const next = !v;
      playUiActionSound(next ? "shield-on" : "shield-off");
      return next;
    });
  }, [playUiActionSound]);

  const triggerHyperJump = useCallback(() => {
    if (isShipManeuvering || isHyperJumping || !config) return;
    setIsHyperJumping(true);
    pulseScreenFlash(reduceMotion ? 100 : 180);
    pulseNebula(reduceMotion ? 220 : 420);
    const centerPct =
      config.steps.length > 0 ? ((config.activeStepIndex + 0.5) / config.steps.length) * 100 : 50;
    spawnShockwave(centerPct);
    const burstTimer = window.setTimeout(() => {
      void emitLaserShot(
        Math.max(0, centerPct - 10 * intensityScale),
        Math.min(100, centerPct + 10 * intensityScale),
        "celebrate",
        { affectHeat: false, withSound: true }
      );
    }, 120);
    const doneTimer = window.setTimeout(() => setIsHyperJumping(false), reduceMotion ? 280 : 620);
    actionTimersRef.current.push(burstTimer, doneTimer);
  }, [
    config,
    emitLaserShot,
    intensityScale,
    isHyperJumping,
    isShipManeuvering,
    pulseNebula,
    pulseScreenFlash,
    reduceMotion,
    spawnShockwave,
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
  const laserCoolingLocked = laserHeat >= LASER_HEAT_MAX - LASER_HEAT_PER_SHOT;

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
            <div className="w-28 shrink-0">
              <p className="mb-1 text-right text-[0.58rem] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                Laser heat
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={
                    "h-full transition-[width,background-color] duration-200 " +
                    (laserCoolingLocked ? "bg-rose-500" : "bg-cyan-500")
                  }
                  style={{ width: `${laserHeat}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[0.62rem] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                FX
              </label>
              <select
                value={effectIntensity}
                onChange={(e) =>
                  setEffectIntensity(e.target.value as "low" | "medium" | "high")
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[0.68rem] text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <label className="flex items-center gap-1 text-[0.68rem] text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => setReduceMotion(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600"
                />
                Reduce
              </label>
            </div>
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
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={triggerBoost}
                disabled={isShipManeuvering || isBoosting}
                className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
              >
                Boost
              </button>
              <button
                type="button"
                onClick={triggerRoll}
                disabled={isShipManeuvering || isRolling}
                className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              >
                Barrel Roll
              </button>
              <button
                type="button"
                onClick={triggerFirePulse}
                disabled={isShipManeuvering || pulseLocked}
                className="rounded-lg border border-fuchsia-300 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:hover:bg-fuchsia-900/50"
              >
                Fire Pulse
              </button>
              <button
                type="button"
                onClick={toggleShield}
                disabled={isShipManeuvering}
                className={
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 " +
                  (isShieldOn
                    ? "border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700")
                }
              >
                {isShieldOn ? "Shield On" : "Shield Off"}
              </button>
              <button
                type="button"
                onClick={triggerHyperJump}
                disabled={isShipManeuvering || isHyperJumping}
                className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/50"
              >
                Hyper Jump
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
            className={
              "pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300 " +
              (nebulaPulse ? "opacity-100" : "opacity-0")
            }
            style={
              {
                background:
                  "radial-gradient(ellipse 40% 50% at 50% 60%, color-mix(in srgb, var(--laser-a, #22d3ee) 24%, transparent) 0%, transparent 68%), radial-gradient(ellipse 34% 46% at 65% 58%, color-mix(in srgb, var(--laser-b, #a78bfa) 22%, transparent) 0%, transparent 70%)",
                ...( { "--laser-a": ui.laserColorA, "--laser-b": ui.laserColorB } as CSSProperties ),
              } as CSSProperties
            }
            aria-hidden
          />
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
          {laserShots.map((shot) => {
            const leftPct = Math.min(shot.startPct, shot.endPct);
            const widthPct = Math.max(0.6, Math.abs(shot.endPct - shot.startPct));
            const toRight = shot.endPct >= shot.startPct;
            return (
              <span
                key={shot.id}
                className={
                  "ship-laser-shot pointer-events-none absolute top-[60%] z-[18] -translate-y-1/2 " +
                  (laserCoolingLocked ? "ship-laser-overheated " : "") +
                  (shot.variant === "target"
                    ? "ship-laser-target"
                    : shot.variant === "celebrate"
                      ? "ship-laser-celebrate"
                      : "ship-laser-step")
                }
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  transformOrigin: toRight ? "left center" : "right center",
                  ...({
                    "--laser-a": ui.laserColorA,
                    "--laser-b": ui.laserColorB,
                  } as CSSProperties),
                }}
                aria-hidden
              />
            );
          })}
          {impactBursts.map((burst) => (
            <span
              key={burst.id}
              className="ship-impact-burst pointer-events-none absolute top-[60%] z-[19] -translate-x-1/2 -translate-y-1/2"
              style={
                {
                  left: `${burst.atPct}%`,
                  "--laser-a": ui.laserColorA,
                  "--laser-b": ui.laserColorB,
                  "--fx-scale": String(intensityScale),
                } as CSSProperties
              }
              aria-hidden
            />
          ))}
          {shockwaves.map((wave) => (
            <span
              key={wave.id}
              className="ship-shockwave pointer-events-none absolute top-[60%] z-[17] -translate-x-1/2 -translate-y-1/2"
              style={
                {
                  left: `${wave.atPct}%`,
                  "--laser-a": ui.laserColorA,
                  "--laser-b": ui.laserColorB,
                  "--fx-scale": String(intensityScale),
                } as CSSProperties
              }
              aria-hidden
            />
          ))}

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
                  (shipThrust ? "ship-thrust-active " : "") +
                  (isBoosting ? "ship-boosting " : "") +
                  (isRolling ? "ship-rolling " : "") +
                  (isShieldOn ? "ship-shield-on " : "") +
                  (isHyperJumping ? "ship-hyper-jump " : "") +
                  (laserCoolingLocked ? "ship-overheated " : "") +
                  (reduceMotion ? "ship-reduced-motion " : "")
                }
                style={
                  {
                    "--flame-a": ui.flameColorA,
                    "--flame-b": ui.flameColorB,
                    "--laser-a": ui.laserColorA,
                    "--laser-b": ui.laserColorB,
                    "--fx-scale": String(intensityScale),
                  } as CSSProperties
                }
              >
                <span
                  className={
                    "ship-local-flash " + (screenFlash ? "ship-local-flash-on" : "")
                  }
                  aria-hidden
                />
                <span className="ship-shield" aria-hidden />
                <span className="ship-shield ship-shield-ring-2" aria-hidden />
                <span className="ship-shield ship-shield-ring-3" aria-hidden />
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
                {(isBoosting || isShipManeuvering) && !reduceMotion && (
                  <>
                    <span className="ship-afterimage ship-afterimage-1" aria-hidden />
                    <span className="ship-afterimage ship-afterimage-2" aria-hidden />
                    <span className="ship-afterimage ship-afterimage-3" aria-hidden />
                  </>
                )}
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
                disabled={isShipManeuvering}
                aria-pressed={isActive}
                aria-label={`B\u01b0\u1edbc ${i + 1}: ${getStepSummary(step)}`}
                className={cardClass + " disabled:cursor-not-allowed disabled:opacity-80"}
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
