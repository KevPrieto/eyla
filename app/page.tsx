"use client";

import { useEffect, useMemo, useState } from "react";
import Roadmap, { Phase } from "@/components/Roadmap";
import SoftTimeline from "@/components/SoftTimeline";

type ThemeMode = "dark" | "light";

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
}

const STORAGE_KEY = "eyla-project";
const THEME_KEY = "eyla-theme";

function generateLocalRoadmap(): Phase[] {
  return [
    {
      id: uid(),
      name: "Planning",
      steps: [
        { id: uid(), text: "Define the problem", completed: false },
        { id: uid(), text: "Clarify the core idea", completed: false },
      ],
    },
    {
      id: uid(),
      name: "Design",
      steps: [
        { id: uid(), text: "Sketch main user flow", completed: false },
        { id: uid(), text: "Decide MVP scope", completed: false },
      ],
    },
    {
      id: uid(),
      name: "Development",
      steps: [
        { id: uid(), text: "Implement core logic", completed: false },
        { id: uid(), text: "Test interactions", completed: false },
      ],
    },
  ];
}

export default function Page() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [idea, setIdea] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    const rawTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (rawTheme) setTheme(rawTheme);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setIdea(parsed.idea ?? "");
      setPhases(parsed.phases ?? []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ idea, phases }));
  }, [idea, phases]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const ui = useMemo(
    () => ({
      page:
        "min-h-screen bg-[radial-gradient(1400px_800px_at_50%_0%,rgba(56,189,248,0.16),transparent_62%),linear-gradient(to_bottom,#050b18,#060b16)] text-slate-100",

      sidebar:
        "fixed left-0 top-0 h-screen w-[280px] bg-[#050b16] border-r border-slate-800",

      canvas: "ml-[280px] min-h-screen flex justify-center",

      stage: "w-full max-w-[1280px] px-10 md:px-14 py-16",

      subtitle: "text-slate-300/70",
      divider: "border-slate-800/60",
      input:
        "w-full p-5 text-lg bg-transparent border border-slate-700/80 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600",
      primary:
        "mt-5 w-full py-4 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white",
      ghost:
        "text-xs text-slate-500 hover:text-slate-300 transition",
      hint:
        "text-[11px] uppercase tracking-wider text-slate-500",
    }),
    []
  );

  const hasRoadmap = phases.length > 0;

  function start() {
    if (!idea.trim()) return;
    setPhases(generateLocalRoadmap());
  }

  function reset() {
    setIdea("");
    setPhases([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className={ui.page}>
      {/* SIDEBAR (quiet, contextual memory) */}
      <aside className={ui.sidebar}>
        <div className="h-full flex flex-col px-7 py-8">
          {/* Logo mark (preserve aspect ratio) */}
          <div className="flex items-center justify-center mb-10">
            <img
              src="/eyla-spiral.png"
              alt="EYLA"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Context label */}
          <div className={ui.hint}>Focus</div>

          <div className={`my-6 border-t ${ui.divider}`} />

          {/* Timeline (read-only memory) */}
          <div className={ui.hint}>Timeline</div>
          <div className="mt-3">
            <SoftTimeline phases={phases} theme={theme} maxNext={2} />
          </div>

          <div className="flex-1" />

          <div className={`pt-6 border-t ${ui.divider} flex items-center justify-between`}>
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className={ui.ghost}
            >
              Toggle theme
            </button>

            {hasRoadmap && (
              <button onClick={reset} className={ui.ghost}>
                Reset
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* CANVAS */}
      <div className={ui.canvas}>
        <section className={ui.stage}>
          {/* Stage identity (wordmark - width-based for proper sizing) */}
          <header className="text-center mb-14 md:mb-16">
            <img
              src="/eyla-wordmark.png"
              alt="EYLA"
              className="h-auto mx-auto mb-3 object-contain"
              style={{ width: "clamp(200px, 35vw, 280px)" }}
            />
            <p className={`${ui.subtitle} text-base md:text-lg`}>
              {hasRoadmap
                ? "One step at a time. The rest can wait."
                : "What do you want to work on?"}
            </p>
          </header>

          {/* Roadmap mode (only mode for now) */}
          {!hasRoadmap && (
            <div className="max-w-2xl mx-auto">
              <input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
                placeholder="Describe your project or idea..."
                className={ui.input}
              />
              <button onClick={start} className={ui.primary}>
                Start planning
              </button>
            </div>
          )}

          {hasRoadmap && (
            <Roadmap phases={phases} setPhases={setPhases} theme={theme} />
          )}
        </section>
      </div>
    </main>
  );
}
