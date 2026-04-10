"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProgressBarView } from "@/components/ProgressBarView";
import { SpaceAmbience } from "@/components/SpaceAmbience";
import { loadUiSettings, type PageUiSettings } from "@/lib/ui-settings";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [ui, setUi] = useState<PageUiSettings | null>(null);

  useEffect(() => {
    setUi(loadUiSettings());
  }, [refreshKey]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col text-slate-800">
      {/* Nền vũ trụ CSS (file /space-bg.jpg không có trong public — dùng gradient + tinh vân có animation) */}
      <div
        className="pointer-events-none fixed inset-0 -z-30 overflow-hidden bg-[#050510]"
        aria-hidden
      >
        <div className="cosmic-bg-layer cosmic-bg-drift absolute inset-[-15%] min-h-[130%] min-w-[130%]" />
        <div className="cosmic-starfield cosmic-starfield-drift pointer-events-none absolute inset-0 opacity-[0.82]" />
      </div>

      {ui?.spaceEffectsEnabled !== false ? <SpaceAmbience /> : null}

      {/* Phủ nhẹ — trước đây trắng ~80% khiến Chrome nhìn nhạt, tắt bớt để lộ màu tinh vân */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/52 via-sky-100/14 to-fuchsia-950/28"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(255,255,255,0.32)_0%,transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_75%_55%_at_85%_100%,rgba(34,211,238,0.26)_0%,transparent_48%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_10%_95%,rgba(167,139,250,0.18)_0%,transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18] [background-image:radial-gradient(rgba(15,118,110,0.09)_1px,transparent_1px)] [background-size:22px_22px]"
        aria-hidden
      />

      <header className="border-b border-slate-200/80 bg-white/92 px-4 py-4 shadow-md shadow-slate-900/5 backdrop-blur-md sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            {ui && (
              <>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-teal-600">
                  {ui.pageEyebrow}
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {ui.pageTitle}
                </h1>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {ui.pageDescription}
                </p>
              </>
            )}
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-orange-200/60 transition hover:from-amber-400 hover:to-orange-400 sm:px-4 sm:text-sm"
            >
              Cập nhật
            </button>
            <Link
              href="/setup"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4 sm:text-sm"
            >
              Cấu hình
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <ProgressBarView refreshKey={refreshKey} />
      </main>
    </div>
  );
}
