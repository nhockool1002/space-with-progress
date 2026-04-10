import defaultAppConfig from "@/config/default-app-config.json";

export const UI_SETTINGS_KEY = "spaceship-progress-ui";
export const UI_SETTINGS_VERSION = 2;

/** Tiêu đề / mô tả mặc định (theo `config/default-app-config.json`) */
export const DEFAULT_PROJECT_HEADING = defaultAppConfig.ui.pageTitle;

/** Chuỗi mặc định cũ (localStorage) — tự nâng lên DEFAULT_PROJECT_HEADING */
const LEGACY_PAGE_TITLE = "Theo d\u00f5i l\u1ecbch & t\u00e0u v\u0169 tr\u1ee5";
const LEGACY_PAGE_DESCRIPTION =
  "D\u1eef li\u1ec7u l\u01b0u tr\u00ean tr\u00ecnh duy\u1ec7t (localStorage). Nh\u1ea5n b\u01b0\u1edbc ho\u1eb7c m\u1ed1c tr\u00ean \u0111\u01b0\u1eddng ray \u0111\u1ec3 t\u00e0u bay \u2014 c\u00f3 hi\u1ec7u \u1ee9ng tr\u01b0\u1ee3t. Ch\u1ecdn \u0111\u1ec3 xem / ho\u00e0n th\u00e0nh c\u00e1c b\u01b0\u1edbc ch\u01b0a xong; kh\u00f4ng quay l\u1ea1i b\u01b0\u1edbc \u0111\u00e3 ho\u00e0n th\u00e0nh.";

export type PageUiSettings = {
  schemaVersion: number;
  /** Phụ đề trên cùng trang chính (header) */
  pageEyebrow: string;
  pageTitle: string;
  pageDescription: string;
  /** Khối panel timeline */
  panelEyebrow: string;
  panelTitle: string;
  panelHint: string;
  /** Sao / hiệu ứng nền vũ trụ nhẹ trên trang chính */
  spaceEffectsEnabled: boolean;
};

function normalizeHeadingField(
  raw: unknown,
  fallback: string,
  legacy: string
): string {
  if (raw == null) return fallback;
  const s = String(raw).trim();
  if (s === "" || s === legacy) return fallback;
  return s;
}

export function getDefaultUiSettings(): PageUiSettings {
  const u = defaultAppConfig.ui;
  return {
    schemaVersion: UI_SETTINGS_VERSION,
    pageEyebrow: String(u.pageEyebrow ?? ""),
    pageTitle: String(u.pageTitle ?? DEFAULT_PROJECT_HEADING),
    pageDescription: String(u.pageDescription ?? DEFAULT_PROJECT_HEADING),
    panelEyebrow: String(u.panelEyebrow ?? ""),
    panelTitle: String(u.panelTitle ?? ""),
    panelHint: String(u.panelHint ?? ""),
    spaceEffectsEnabled:
      typeof u.spaceEffectsEnabled === "boolean" ? u.spaceEffectsEnabled : true,
  };
}

export function loadUiSettings(): PageUiSettings {
  if (typeof window === "undefined") return getDefaultUiSettings();
  try {
    const raw = window.localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return getDefaultUiSettings();
    const o = JSON.parse(raw) as Partial<PageUiSettings>;
    const def = getDefaultUiSettings();
    return {
      schemaVersion: UI_SETTINGS_VERSION,
      pageEyebrow: String(o.pageEyebrow ?? def.pageEyebrow),
      pageTitle: normalizeHeadingField(
        o.pageTitle,
        def.pageTitle,
        LEGACY_PAGE_TITLE
      ),
      pageDescription: normalizeHeadingField(
        o.pageDescription,
        def.pageDescription,
        LEGACY_PAGE_DESCRIPTION
      ),
      panelEyebrow: String(o.panelEyebrow ?? def.panelEyebrow),
      panelTitle: String(o.panelTitle ?? def.panelTitle),
      panelHint: String(o.panelHint ?? def.panelHint),
      spaceEffectsEnabled:
        typeof o.spaceEffectsEnabled === "boolean"
          ? o.spaceEffectsEnabled
          : def.spaceEffectsEnabled,
    };
  } catch {
    return getDefaultUiSettings();
  }
}

export function saveUiSettings(s: PageUiSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    UI_SETTINGS_KEY,
    JSON.stringify({ ...s, schemaVersion: UI_SETTINGS_VERSION })
  );
}
