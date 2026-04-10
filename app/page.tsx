"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProgressBarView } from "@/components/ProgressBarView";
import { loadUiSettings, type PageUiSettings } from "@/lib/ui-settings";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [ui, setUi] = useState<PageUiSettings | null>(null);

  useEffect(() => {
    setUi(loadUiSettings());
  }, [refreshKey]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col text-slate-800">
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-slate-100 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/space-bg.jpg)" }}
        aria-hidden
      />
      {/* Lớp sáng: giữ ảnh vũ trụ nhưng UI tông sáng */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-50/92 via-sky-50/88 to-slate-100/95"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,rgba(255,255,255,0.5)_0%,transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [background-image:radial-gradient(rgba(15,118,110,0.06)_1px,transparent_1px)] [background-size:20px_20px]"
        aria-hidden
      />

      <header className="border-b border-slate-200/90 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-md sm:py-5">
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
