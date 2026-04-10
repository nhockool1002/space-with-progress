import defaultAppConfig from "@/config/default-app-config.json";

export const PROGRESS_STORAGE_KEY = "spaceship-progress-config";

/** Sequential completed steps; step i is done when i < completedCount */
export const CONFIG_SCHEMA_VERSION = 3;

export type ProgressStep = {
  id: string;
  time: string;
  title: string;
  colorA: string;
  colorB: string;
};

export type ProgressConfig = {
  schemaVersion?: number;
  steps: ProgressStep[];
  activeStepIndex: number;
  /** Số bư��c đã hoàn thành tuần tự (0 … steps.length). Bư��c i đã xong khi i < completedCount */
  completedCount: number;
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getStepSummary(step: ProgressStep): string {
  if (step.time.trim()) {
    return `${step.time} · ${step.title}`;
  }
  return step.title;
}

type LegacyStep = ProgressStep & { label?: string };

function normalizeStep(raw: unknown): ProgressStep {
  const o = raw as LegacyStep;
  const id = typeof o?.id === "string" ? o.id : uid();
  const hasNew = typeof o?.title === "string" || typeof o?.time === "string";
  if (hasNew) {
    return {
      id,
      time: String(o.time ?? ""),
      title: String(o.title ?? ""),
      colorA: String(o.colorA ?? "#22c55e"),
      colorB: String(o.colorB ?? "#ef4444"),
    };
  }
  const label = String(o?.label ?? "");
  return {
    id,
    time: "",
    title: label,
    colorA: String(o.colorA ?? "#22c55e"),
    colorB: String(o.colorB ?? "#ef4444"),
  };
}

export function getDefaultConfig(): ProgressConfig {
  const p = defaultAppConfig.progress;
  const steps: ProgressStep[] = p.steps.map((s) => ({
    id: String(s.id),
    time: String(s.time ?? ""),
    title: String(s.title ?? ""),
    colorA: String(s.colorA ?? "#22c55e"),
    colorB: String(s.colorB ?? "#ef4444"),
  }));
  return clampConfig(
    steps,
    typeof p.activeStepIndex === "number" ? p.activeStepIndex : 0,
    typeof p.completedCount === "number" ? p.completedCount : 0
  );
}

function clampConfig(
  steps: ProgressStep[],
  activeStepIndex: number,
  completedCount: number
): ProgressConfig {
  const n = steps.length;
  const c = Math.max(0, Math.min(completedCount, n));
  let a = Math.max(0, Math.min(activeStepIndex, n - 1));
  if (n === 0) {
    return {
      schemaVersion: CONFIG_SCHEMA_VERSION,
      steps,
      activeStepIndex: 0,
      completedCount: 0,
    };
  }
  if (a < c) {
    a = Math.min(c, n - 1);
  }
  return {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    steps,
    activeStepIndex: a,
    completedCount: c,
  };
}

export function loadConfig(): ProgressConfig {
  if (typeof window === "undefined") {
    return getDefaultConfig();
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return getDefaultConfig();
    const parsed = JSON.parse(raw) as {
      schemaVersion?: number;
      steps?: unknown[];
      activeStepIndex?: number;
      completedCount?: number;
    };
    if (!parsed.steps?.length) return getDefaultConfig();

    const steps = parsed.steps.map(normalizeStep);
    const version = parsed.schemaVersion ?? 1;

    const completedCount =
      typeof parsed.completedCount === "number" ? parsed.completedCount : 0;
    const active = parsed.activeStepIndex ?? 0;

    const normalized = clampConfig(steps, active, completedCount);

    if (version !== CONFIG_SCHEMA_VERSION) {
      saveConfig(normalized);
    }

    return normalized;
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(config: ProgressConfig): void {
  if (typeof window === "undefined") return;
  const n = config.steps.length;
  const c = Math.max(0, Math.min(config.completedCount, n));
  let a = Math.max(0, Math.min(config.activeStepIndex, Math.max(0, n - 1)));
  if (n > 0 && a < c) a = Math.min(c, n - 1);

  const payload: ProgressConfig = {
    ...config,
    schemaVersion: CONFIG_SCHEMA_VERSION,
    completedCount: c,
    activeStepIndex: a,
  };
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload));
}
