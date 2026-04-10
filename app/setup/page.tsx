"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getDefaultConfig,
  loadConfig,
  saveConfig,
  getStepSummary,
  type ProgressConfig,
  type ProgressStep,
} from "@/lib/progress-storage";
import {
  getDefaultUiSettings,
  loadUiSettings,
  saveUiSettings,
  type PageUiSettings,
} from "@/lib/ui-settings";

function newStep(): ProgressStep {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    time: "",
    title: "B\u01b0\u1edbc m\u1edbi",
    colorA: "#22c55e",
    colorB: "#ef4444",
  };
}

export default function SetupPage() {
  const [config, setConfig] = useState<ProgressConfig | null>(null);
  const [ui, setUi] = useState<PageUiSettings | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savedUiAt, setSavedUiAt] = useState<number | null>(null);

  useEffect(() => {
    setConfig(loadConfig());
    setUi(loadUiSettings());
  }, []);

  const updateStep = (index: number, patch: Partial<ProgressStep>) => {
    setConfig((c) => {
      if (!c) return c;
      const steps = [...c.steps];
      steps[index] = { ...steps[index], ...patch };
      return { ...c, steps };
    });
  };

  const addStep = () => {
    setConfig((c) => {
      if (!c) return c;
      const steps = [...c.steps, newStep()];
      const completedCount = Math.min(c.completedCount, steps.length);
      let active = Math.min(c.activeStepIndex, steps.length - 1);
      if (active < completedCount) active = Math.min(completedCount, steps.length - 1);
      return { ...c, steps, completedCount, activeStepIndex: active };
    });
  };

  const removeStep = (index: number) => {
    setConfig((c) => {
      if (!c || c.steps.length <= 1) return c;
      const steps = c.steps.filter((_, i) => i !== index);
      let completedCount = c.completedCount;
      let active = c.activeStepIndex;
      if (index < completedCount) completedCount -= 1;
      if (index < active) active -= 1;
      else if (index === active) active = Math.min(active, steps.length - 1);
      active = Math.max(0, Math.min(active, steps.length - 1));
      completedCount = Math.max(0, Math.min(completedCount, steps.length));
      if (active < completedCount) active = Math.min(completedCount, steps.length - 1);
      return { ...c, steps, activeStepIndex: active, completedCount };
    });
  };

  const handleSave = useCallback(() => {
    if (!config) return;
    saveConfig(config);
    setSavedAt(Date.now());
  }, [config]);

  const handleSaveUi = useCallback(() => {
    if (!ui) return;
    saveUiSettings(ui);
    setSavedUiAt(Date.now());
  }, [ui]);

  const resetDefaults = () => {
    setConfig(getDefaultConfig());
  };

  const resetUiDefaults = () => {
    setUi(getDefaultUiSettings());
  };

  if (!config || !ui) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-slate-500">
        {"\u0110ang t\u1ea3i\u2026"}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/90 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Cấu hình Progress bar
          </h1>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Trang chính
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <section className="space-y-4 rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            Nội dung trang chính & panel
          </h2>
          <p className="text-xs text-slate-500">
            {
              "C\u00e1c d\u00f2ng ch\u1eef hi\u1ec3n th\u1ecb \u1edf header v\u00e0 kh\u1ed1i l\u1ecbch; ch\u1ec9nh b\u1ea5t c\u1ee9 l\u00fac n\u00e0o."
            }
          </p>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-600">
                Phụ đề header (eyebrow)
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                value={ui.pageEyebrow}
                onChange={(e) =>
                  setUi((u) => (u ? { ...u, pageEyebrow: e.target.value } : u))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">
                Tiêu đề header
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                value={ui.pageTitle}
                onChange={(e) =>
                  setUi((u) => (u ? { ...u, pageTitle: e.target.value } : u))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">
                Mô tả header
              </label>
              <textarea
                rows={3}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                value={ui.pageDescription}
                onChange={(e) =>
                  setUi((u) =>
                    u ? { ...u, pageDescription: e.target.value } : u
                  )
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">
                Phụ đề panel (lịch)
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                value={ui.panelEyebrow}
                onChange={(e) =>
                  setUi((u) => (u ? { ...u, panelEyebrow: e.target.value } : u))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">
                Tiêu đề panel
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                value={ui.panelTitle}
                onChange={(e) =>
                  setUi((u) => (u ? { ...u, panelTitle: e.target.value } : u))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">
                {"G\u1ee3i \u00fd panel (d\u00f2ng nh\u1ecf)"}
              </label>
              <textarea
                rows={2}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                value={ui.panelHint}
                onChange={(e) =>
                  setUi((u) => (u ? { ...u, panelHint: e.target.value } : u))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveUi}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              Lưu nội dung hiển thị
            </button>
            <button
              type="button"
              onClick={resetUiDefaults}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Khôi phục chữ mặc định
            </button>
          </div>
          {savedUiAt != null && (
            <p className="text-xs text-teal-700">
              {"\u0110\u00e3 l\u01b0u n\u1ed9i dung l\u00fac"}{" "}
              {new Date(savedUiAt).toLocaleTimeString("vi-VN")}
            </p>
          )}
        </section>

        <p className="text-sm text-slate-600">
          {
            "Ch\u1ec9nh khung gi\u1edd, n\u1ed9i dung v\u00e0 m\u00e0u nh\u1ea5p nh\u00e1y. Ti\u1ebfn \u0111\u1ed9 ho\u00e0n th\u00e0nh do n\u00fat tr\u00ean trang ch\u00ednh; \u1edf \u0111\u00e2y c\u00f3 th\u1ec3 \u0111\u1eb7t b\u01b0\u1edbc \u0111ang ch\u1ecdn."
          }
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-800">
            {"B\u01b0\u1edbc \u0111ang active (t\u00e0u)"}
          </label>
          <select
            className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
            value={config.activeStepIndex}
            onChange={(e) =>
              setConfig((c) =>
                c ? { ...c, activeStepIndex: Number(e.target.value) } : c
              )
            }
          >
            {config.steps.map((s, i) => (
              <option key={s.id} value={i}>
                {i + 1}. {getStepSummary(s)}
                {i < config.completedCount ? " (đã hoàn thành)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            {"\u0110\u00e3 ho\u00e0n th\u00e0nh tu\u1ea7n t\u1ef1:"}{" "}
            {config.completedCount}/{config.steps.length}
            {
              " \u2014 n\u1ebfu active < s\u1ed1 n\u00e0y s\u1ebd \u0111\u01b0\u1ee3c ch\u1ec9nh l\u1ea1i khi l\u01b0u."
            }
          </p>
        </div>

        <ul className="space-y-4">
          {config.steps.map((step, index) => (
            <li
              key={step.id}
              className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {"B\u01b0\u1edbc"} {index + 1}
                  {index < config.completedCount ? (
                    <span className="ml-2 text-emerald-600">· đã xong</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                  onClick={() => removeStep(index)}
                  disabled={config.steps.length <= 1}
                >
                  Xóa
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">
                    {"Khung gi\u1edd"}
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="08:00 hoặc 08:15 - 08:30"
                    value={step.time}
                    onChange={(e) =>
                      updateStep(index, { time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">
                    Nội dung
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/40"
                    value={step.title}
                    onChange={(e) =>
                      updateStep(index, { title: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">
                      Màu A
                    </label>
                    <input
                      type="color"
                      className="h-10 w-full cursor-pointer rounded border border-slate-300 bg-white"
                      value={step.colorA}
                      onChange={(e) =>
                        updateStep(index, { colorA: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">
                      Màu B
                    </label>
                    <input
                      type="color"
                      className="h-10 w-full cursor-pointer rounded border border-slate-300 bg-white"
                      value={step.colorB}
                      onChange={(e) =>
                        updateStep(index, { colorB: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addStep}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {"+ Th\u00eam b\u01b0\u1edbc"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-400"
          >
            {"L\u01b0u c\u1ea5u h\u00ecnh b\u01b0\u1edbc"}
          </button>
          <button
            type="button"
            onClick={resetDefaults}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Khôi phục mặc định (6 mốc + tiến độ 0)
          </button>
        </div>

        {savedAt != null && (
          <p className="text-sm text-emerald-700">
            {"\u0110\u00e3 l\u01b0u b\u01b0\u1edbc l\u00fac"}{" "}
            {new Date(savedAt).toLocaleTimeString("vi-VN")}
          </p>
        )}
      </main>
    </div>
  );
}
