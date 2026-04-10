"use client";

import { useEffect, useState } from "react";
import {
  THEME_STORAGE_KEY,
  applyColorScheme,
  loadColorScheme,
  saveColorScheme,
  type ColorScheme,
} from "@/lib/theme";

type Props = {
  /** default: header; compact: vùng hẹp */
  size?: "default" | "compact";
};

export function ThemeToggle({ size = "default" }: Props) {
  const [scheme, setScheme] = useState<ColorScheme>("dark");

  useEffect(() => {
    setScheme(loadColorScheme());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY || !e.newValue) return;
      if (e.newValue === "dark" || e.newValue === "light") {
        applyColorScheme(e.newValue);
        setScheme(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const select = (next: ColorScheme) => {
    saveColorScheme(next);
    applyColorScheme(next);
    setScheme(next);
  };

  const pad =
    size === "compact"
      ? "px-2 py-1.5 text-[0.65rem]"
      : "px-3 py-2 text-xs sm:text-sm";

  return (
    <div
      className="inline-flex rounded-xl border border-slate-300/90 bg-slate-100/90 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/90"
      role="group"
      aria-label="Chế độ giao diện"
    >
      <button
        type="button"
        onClick={() => select("light")}
        aria-pressed={scheme === "light"}
        className={
          "rounded-lg font-medium transition " +
          pad +
          (scheme === "light"
            ? " bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
            : " text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")
        }
      >
        Sáng
      </button>
      <button
        type="button"
        onClick={() => select("dark")}
        aria-pressed={scheme === "dark"}
        className={
          "rounded-lg font-medium transition " +
          pad +
          (scheme === "dark"
            ? " bg-slate-800 text-white shadow-sm dark:bg-slate-600 dark:text-white"
            : " text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200")
        }
      >
        Tối
      </button>
    </div>
  );
}
