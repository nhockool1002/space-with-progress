export const THEME_STORAGE_KEY = "spaceship-color-scheme";

export type ColorScheme = "light" | "dark";

export function loadColorScheme(): ColorScheme {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function saveColorScheme(scheme: ColorScheme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, scheme);
  } catch {
    /* ignore */
  }
}

/** Áp dụng class `dark` lên `<html>` (Tailwind class strategy). */
export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (scheme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}
