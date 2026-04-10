export const UI_SETTINGS_KEY = "spaceship-progress-ui";
export const UI_SETTINGS_VERSION = 1;

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
};

export function getDefaultUiSettings(): PageUiSettings {
  return {
    schemaVersion: UI_SETTINGS_VERSION,
    pageEyebrow: "Di\u1ec5n t\u1eadp \u00b7 Progress",
    pageTitle: "Theo d\u00f5i l\u1ecbch & t\u00e0u v\u0169 tr\u1ee5",
    pageDescription:
      "D\u1eef li\u1ec7u l\u01b0u tr\u00ean tr\u00ecnh duy\u1ec7t (localStorage). Nh\u1ea5n b\u01b0\u1edbc ho\u1eb7c m\u1ed1c tr\u00ean \u0111\u01b0\u1eddng ray \u0111\u1ec3 t\u00e0u bay \u2014 c\u00f3 hi\u1ec7u \u1ee9ng tr\u01b0\u1ee3t. Ch\u1ecdn \u0111\u1ec3 xem / ho\u00e0n th\u00e0nh c\u00e1c b\u01b0\u1edbc ch\u01b0a xong; kh\u00f4ng quay l\u1ea1i b\u01b0\u1edbc \u0111\u00e3 ho\u00e0n th\u00e0nh.",
    panelEyebrow: "L\u1ecbch di\u1ec5n t\u1eadp",
    panelTitle: "Ti\u1ebfn tr\u00ecnh theo khung gi\u1edd",
    panelHint:
      "Ch\u1ecdn m\u1ed1c (ch\u01b0a ho\u00e0n th\u00e0nh) \u0111\u1ec3 t\u00e0u bay t\u1edbi \u00b7 d\u00f9ng Ho\u00e0n th\u00e0nh b\u01b0\u1edbc \u0111\u1ec3 kh\u00f3a ti\u1ebfn tr\u00ecnh",
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
      pageTitle: String(o.pageTitle ?? def.pageTitle),
      pageDescription: String(o.pageDescription ?? def.pageDescription),
      panelEyebrow: String(o.panelEyebrow ?? def.panelEyebrow),
      panelTitle: String(o.panelTitle ?? def.panelTitle),
      panelHint: String(o.panelHint ?? def.panelHint),
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
