"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Phase, Step, ThemeMode } from "@/types";

// Re-export types for backwards compatibility
export type { Phase, Step };

type RoadmapProps = {
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
  theme?: ThemeMode;
};

/* ---------- helpers ---------- */

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
}

type FlatRef = {
  phaseIndex: number;
  stepIndex: number;
  phaseId: string;
  stepId: string;
  phaseName: string;
  text: string;
  completed: boolean;
  linearIndex: number;
};

function flatten(phases: Phase[]): FlatRef[] {
  const out: FlatRef[] = [];
  let k = 0;
  for (let pi = 0; pi < phases.length; pi++) {
    const p = phases[pi];
    for (let si = 0; si < p.steps.length; si++) {
      const s = p.steps[si];
      out.push({
        phaseIndex: pi,
        stepIndex: si,
        phaseId: p.id,
        stepId: s.id,
        phaseName: p.name,
        text: s.text,
        completed: s.completed,
        linearIndex: k++,
      });
    }
  }
  return out;
}

function firstIncompleteIndex(flat: FlatRef[]) {
  return flat.findIndex((x) => !x.completed);
}

function allDone(flat: FlatRef[]) {
  return flat.length > 0 && flat.every((x) => x.completed);
}

function setFocusByLinearIndex(
  prev: Phase[],
  focusIndex: number
): Phase[] {
  const flat = flatten(prev);
  const maxIdx = flat.length - 1;
  const i = Math.max(0, Math.min(focusIndex, maxIdx));

  return prev.map((p, pi) => ({
    ...p,
    steps: p.steps.map((s, si) => {
      const ref = flat.find((r) => r.phaseIndex === pi && r.stepIndex === si);
      if (!ref) return s;
      const shouldBeCompleted = ref.linearIndex < i;
      return { ...s, completed: shouldBeCompleted };
    }),
  }));
}

export default function Roadmap({ phases, setPhases, theme = "dark" }: RoadmapProps) {
  const flat = useMemo(() => flatten(phases), [phases]);

  const currentLinearIndex = useMemo(() => {
    return firstIncompleteIndex(flat);
  }, [flat]);

  const done = useMemo(() => allDone(flat), [flat]);

  const current = useMemo(() => {
    if (!flat.length || currentLinearIndex === -1) return null;
    return flat[currentLinearIndex];
  }, [flat, currentLinearIndex]);

  // Past: up to 2 steps before current
  const past = useMemo(() => {
    if (!flat.length) return [];
    const i = currentLinearIndex === -1 ? flat.length : currentLinearIndex;
    return flat.slice(Math.max(0, i - 2), i);
  }, [flat, currentLinearIndex]);

  // Future: up to 2 steps after current
  const future = useMemo(() => {
    if (!flat.length || currentLinearIndex === -1) return [];
    return flat.slice(currentLinearIndex + 1).slice(0, 2);
  }, [flat, currentLinearIndex]);

  const [isEditing, setIsEditing] = useState(false);

  const isDark = theme === "dark";

  const ui = useMemo(
    () =>
      isDark
        ? {
            title: "text-slate-100",
            sub: "text-slate-400",
            frame: "border-slate-800/70 bg-[#0b1220]/55",
            frameCurrent: "border-cyan-500/40 bg-[#0b1220]/70 shadow-lg shadow-cyan-500/10",
            input: "text-slate-100 placeholder:text-slate-500",
            primary: "bg-blue-600 hover:bg-blue-700 text-white",
            ghost: "text-slate-300/80 hover:text-slate-100 border border-slate-700/70 hover:bg-slate-900/40",
            danger: "border border-rose-500/40 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10",
            chip: "text-[11px] px-2 py-1 rounded-full border border-cyan-500/40 text-cyan-400 bg-cyan-900/20",
            pathColor: "#334155",
            pathGlow: "#22d3ee",
            hint: "text-slate-500",
          }
        : {
            title: "text-slate-800",
            sub: "text-slate-500",
            frame: "border-white/50 bg-white/50 backdrop-blur-xl shadow-md shadow-violet-100/20",
            frameCurrent: "border-sky-300/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-violet-200/30",
            input: "text-slate-800 placeholder:text-slate-400",
            primary: "bg-sky-500 hover:bg-sky-600 text-white",
            ghost: "text-slate-600 hover:text-slate-800 border border-white/60 hover:bg-white/60",
            danger: "border border-rose-200 text-rose-500 hover:bg-rose-50/60",
            chip: "text-[11px] px-2 py-1 rounded-full border border-sky-300/60 text-sky-600 bg-sky-50/50",
            pathColor: "#e0e7ff",
            pathGlow: "#0ea5e9",
            hint: "text-slate-400",
          },
    [isDark]
  );

  function setStepText(stepId: string, text: string) {
    const newPhases = phases.map((p) => ({
      ...p,
      steps: p.steps.map((s) => (s.id === stepId ? { ...s, text } : s)),
    }));
    setPhases(newPhases);
  }

  function focusStep(linearIndex: number) {
    setIsEditing(false);
    setPhases(setFocusByLinearIndex(phases, linearIndex));
  }

  function completeCurrent() {
    if (!current) return;
    const idx = flat.findIndex((r) => r.stepId === current.stepId);
    if (idx === -1) return;
    const after = phases.map((p, pi) => ({
      ...p,
      steps: p.steps.map((s, si) => {
        const ref = flat.find((r) => r.phaseIndex === pi && r.stepIndex === si);
        if (!ref) return s;
        return { ...s, completed: ref.linearIndex <= idx ? true : s.completed };
      }),
    }));
    const newFlat = flatten(after);
    const newIdx = firstIncompleteIndex(newFlat);
    if (newIdx === -1) {
      setPhases(after);
      return;
    }
    setPhases(setFocusByLinearIndex(after, newIdx));
  }

  function addStepAfter() {
    if (!current) return;
    const newPhases = phases.map((p, pi) => {
      if (pi !== current.phaseIndex) return p;
      const i = current.stepIndex;
      return {
        ...p,
        steps: [
          ...p.steps.slice(0, i + 1),
          { id: uid(), text: "New step", completed: false },
          ...p.steps.slice(i + 1),
        ],
      };
    });
    setPhases(newPhases);
  }

  function removeCurrent() {
    if (!current) return;
    const updated = phases.map((p, pi) => {
      if (pi !== current.phaseIndex) return p;
      return { ...p, steps: p.steps.filter((s) => s.id !== current.stepId) };
    });
    const newFlat = flatten(updated);
    if (newFlat.length === 0) {
      setPhases(updated);
      return;
    }
    const newFocusIdx = firstIncompleteIndex(newFlat);
    if (newFocusIdx === -1) {
      setPhases(updated);
      return;
    }
    setPhases(setFocusByLinearIndex(updated, newFocusIdx));
  }

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (flat.length === 0) return 0;
    const completed = flat.filter((s) => s.completed).length;
    return Math.round((completed / flat.length) * 100);
  }, [flat]);

  // Total visible steps for path calculation
  const visibleSteps = past.length + (current ? 1 : 0) + future.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className={`text-2xl md:text-3xl font-semibold ${ui.title}`}>
          {done ? "Journey complete." : "Your path forward"}
        </h2>
        <p className={`mt-2 ${ui.sub}`}>
          {done
            ? "You can revisit any step or start fresh."
            : `${progressPercent}% complete · Click any step to refocus`}
        </p>
      </div>

      {/* Horizontal Path Container */}
      <div className="relative w-full overflow-x-auto pb-8">
        <div className="flex items-center justify-center gap-4 min-w-max px-8 py-6">

          {/* SVG Path Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            style={{ minWidth: `${visibleSteps * 200 + 100}px` }}
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={ui.pathColor} stopOpacity="0.3" />
                <stop offset="50%" stopColor={ui.pathGlow} stopOpacity="0.6" />
                <stop offset="100%" stopColor={ui.pathColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Flowing path line */}
            <path
              d={`M 40 50% Q 25% 40%, 50% 50% T 100% 50%`}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ vectorEffect: "non-scaling-stroke" }}
            />
          </svg>

          {/* Past Steps */}
          {past.map((step, i) => (
            <motion.button
              key={step.stepId}
              onClick={() => focusStep(step.linearIndex)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`
                relative flex-shrink-0 w-[160px] rounded-2xl border p-4 transition-all duration-200
                ${ui.frame}
                opacity-50 hover:opacity-80 hover:scale-105
                cursor-pointer
              `}
              title="Click to revisit"
            >
              {/* Connector dot */}
              <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${isDark ? "bg-slate-700" : "bg-violet-200"}`} />

              <div className={`text-[10px] uppercase tracking-wider mb-2 ${ui.hint}`}>Done</div>
              <div className={`text-sm ${ui.title} line-clamp-2`}>{step.text || "Untitled"}</div>
              <div className={`text-[10px] mt-2 ${ui.sub}`}>{step.phaseName}</div>
            </motion.button>
          ))}

          {/* Connector line before current */}
          {past.length > 0 && current && (
            <div className={`w-8 h-1 rounded-full ${isDark ? "bg-gradient-to-r from-slate-700 to-cyan-500" : "bg-gradient-to-r from-violet-200 to-sky-400"}`} />
          )}

          {/* Current Step - Dominant */}
          {current && !done && (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.stepId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`
                  relative flex-shrink-0 w-[280px] rounded-[24px] border p-6 z-10
                  ${ui.frameCurrent}
                `}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-[24px] ${isDark ? "bg-cyan-500/5" : "bg-sky-200/20"} blur-xl -z-10`} />

                {/* Current badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={ui.chip}>NOW</span>
                  <span className={`text-xs ${ui.sub}`}>{current.phaseName}</span>
                </div>

                {/* Editable text */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full text-left"
                    title="Click to edit"
                  >
                    <div className={`text-lg font-medium ${ui.title}`}>
                      {current.text || "Untitled step"}
                    </div>
                  </button>
                ) : (
                  <input
                    autoFocus
                    value={current.text}
                    onChange={(e) => setStepText(current.stepId, e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") setIsEditing(false);
                    }}
                    className={`w-full bg-transparent outline-none text-lg font-medium ${ui.input}`}
                    placeholder="Write the step..."
                  />
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={completeCurrent}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${ui.primary}`}
                  >
                    Complete
                  </button>
                  <button
                    onClick={addStepAfter}
                    className={`px-3 py-2.5 rounded-xl text-sm transition ${ui.ghost}`}
                    title="Add step"
                  >
                    +
                  </button>
                  <button
                    onClick={removeCurrent}
                    className={`px-3 py-2.5 rounded-xl text-sm transition ${ui.danger}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Done state */}
          {done && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                relative flex-shrink-0 w-[280px] rounded-[24px] border p-6
                ${ui.frameCurrent}
              `}
            >
              <div className={`text-center ${ui.title}`}>
                <div className="text-2xl mb-2">✓</div>
                <div className="text-lg font-medium">All complete</div>
                <button
                  onClick={() => focusStep(Math.max(0, flat.length - 1))}
                  className={`mt-4 px-4 py-2 rounded-xl text-sm transition ${ui.ghost}`}
                >
                  Revisit last step
                </button>
              </div>
            </motion.div>
          )}

          {/* Connector line after current */}
          {future.length > 0 && current && (
            <div className={`w-8 h-1 rounded-full ${isDark ? "bg-gradient-to-r from-cyan-500 to-slate-700" : "bg-gradient-to-r from-sky-400 to-violet-200"}`} />
          )}

          {/* Future Steps */}
          {future.map((step, i) => (
            <motion.button
              key={step.stepId}
              onClick={() => focusStep(step.linearIndex)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`
                relative flex-shrink-0 w-[160px] rounded-2xl border p-4 transition-all duration-200
                ${ui.frame}
                opacity-40 hover:opacity-70 hover:scale-105
                cursor-pointer
              `}
              title="Click to focus"
            >
              {/* Connector dot */}
              <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${isDark ? "bg-slate-700" : "bg-violet-200"}`} />

              <div className={`text-[10px] uppercase tracking-wider mb-2 ${ui.hint}`}>Next</div>
              <div className={`text-sm ${ui.title} line-clamp-2`}>{step.text || "Untitled"}</div>
              <div className={`text-[10px] mt-2 ${ui.sub}`}>{step.phaseName}</div>
            </motion.button>
          ))}

          {/* Future indicator when more steps exist */}
          {flat.length > currentLinearIndex + 3 && (
            <div className={`flex items-center gap-1 ${ui.hint}`}>
              <div className={`w-2 h-2 rounded-full ${isDark ? "bg-slate-600" : "bg-violet-200"}`} />
              <div className={`w-2 h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-violet-100"}`} />
              <span className="text-xs ml-1">+{flat.length - currentLinearIndex - 3} more</span>
            </div>
          )}
        </div>
      </div>

      {/* Phase indicators - subtle, below path */}
      <div className="flex items-center justify-center gap-6 mt-4">
        {phases.map((p, i) => {
          const isActive = current ? current.phaseIndex === i : false;
          return (
            <div key={p.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                isActive
                  ? (isDark ? "bg-cyan-400" : "bg-sky-500")
                  : (isDark ? "bg-slate-700" : "bg-violet-200")
              }`} />
              <span className={`text-xs ${isActive ? ui.title : ui.sub}`}>{p.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
