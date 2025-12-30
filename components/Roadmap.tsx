"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ---------- types ---------- */
export interface Step {
  id: string;
  text: string;
  completed: boolean;
}

export interface Phase {
  id: string;
  name: string;
  steps: Step[];
}

type ThemeMode = "dark" | "light";

type RoadmapProps = {
  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
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

/**
 * Reversible deterministic model:
 * - Focus step = index i
 * - All < i => completed true
 * - All >= i => completed false (i is current)
 */
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

  const past = useMemo(() => {
    if (!flat.length) return [];
    const i = currentLinearIndex === -1 ? flat.length : currentLinearIndex;
    return flat.slice(Math.max(0, i - 3), i);
  }, [flat, currentLinearIndex]);

  const future = useMemo(() => {
    if (!flat.length || currentLinearIndex === -1) return [];
    return flat.slice(currentLinearIndex + 1).slice(0, 3);
  }, [flat, currentLinearIndex]);

  const [isEditing, setIsEditing] = useState(false);

  const ui = useMemo(
    () =>
      theme === "dark"
        ? {
            title: "text-slate-100",
            sub: "text-slate-400",
            frame: "border-slate-800/70 bg-[#0b1220]/55",
            input: "text-slate-100 placeholder:text-slate-500",
            primary: "bg-blue-600 hover:bg-blue-700 text-white",
            ghost:
              "text-slate-300/80 hover:text-slate-100 border border-slate-700/70 hover:bg-slate-900/40",
            danger:
              "border border-rose-500/40 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10",
            chip:
              "text-[11px] px-2 py-1 rounded-full border border-slate-700/70 text-slate-300/80",
            dotOn: "bg-cyan-400",
            dotOff: "bg-slate-700",
            hint: "text-slate-500",
            cardHover: "hover:border-slate-700/90 hover:bg-[#0b1220]/70",
            pastIndicator: "text-slate-500",
          }
        : {
            title: "text-slate-900",
            sub: "text-slate-600",
            frame: "border-slate-200 bg-white",
            input: "text-slate-900 placeholder:text-slate-400",
            primary: "bg-sky-600 hover:bg-sky-700 text-white",
            ghost:
              "text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50",
            danger:
              "border border-rose-300 text-rose-600 hover:bg-rose-50",
            chip:
              "text-[11px] px-2 py-1 rounded-full border border-slate-200 text-slate-600",
            dotOn: "bg-sky-500",
            dotOff: "bg-slate-300",
            hint: "text-slate-500",
            cardHover: "hover:border-slate-300 hover:bg-slate-50",
            pastIndicator: "text-slate-400",
          },
    [theme]
  );

  function setStepText(stepId: string, text: string) {
    setPhases((prev) =>
      prev.map((p) => ({
        ...p,
        steps: p.steps.map((s) => (s.id === stepId ? { ...s, text } : s)),
      }))
    );
  }

  function focusStep(linearIndex: number) {
    setIsEditing(false);
    setPhases((prev) => setFocusByLinearIndex(prev, linearIndex));
  }

  function completeCurrent() {
    if (!current) return;
    setPhases((prev) => {
      const flatPrev = flatten(prev);
      const idx = flatPrev.findIndex((r) => r.stepId === current.stepId);
      if (idx === -1) return prev;
      const after = prev.map((p, pi) => ({
        ...p,
        steps: p.steps.map((s, si) => {
          const ref = flatPrev.find((r) => r.phaseIndex === pi && r.stepIndex === si);
          if (!ref) return s;
          return { ...s, completed: ref.linearIndex <= idx ? true : s.completed };
        }),
      }));
      const newFlat = flatten(after);
      const newIdx = firstIncompleteIndex(newFlat);
      if (newIdx === -1) return after;
      return setFocusByLinearIndex(after, newIdx);
    });
  }

  function addStepBefore() {
    if (!current) return;
    setPhases((prev) =>
      prev.map((p, pi) => {
        if (pi !== current.phaseIndex) return p;
        const i = current.stepIndex;
        return {
          ...p,
          steps: [
            ...p.steps.slice(0, i),
            { id: uid(), text: "New step", completed: false },
            ...p.steps.slice(i),
          ],
        };
      })
    );
  }

  function addStepAfter() {
    if (!current) return;
    setPhases((prev) =>
      prev.map((p, pi) => {
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
      })
    );
  }

  function removeCurrent() {
    if (!current) return;
    setPhases((prev) => {
      const updated = prev.map((p, pi) => {
        if (pi !== current.phaseIndex) return p;
        return { ...p, steps: p.steps.filter((s) => s.id !== current.stepId) };
      });
      // Recalculate focus after removal
      const newFlat = flatten(updated);
      if (newFlat.length === 0) return updated;
      const newFocusIdx = firstIncompleteIndex(newFlat);
      if (newFocusIdx === -1) return updated;
      return setFocusByLinearIndex(updated, newFocusIdx);
    });
  }

  // Phase context (passive indicators)
  const phaseDots = useMemo(() => {
    const idx = current ? current.phaseIndex : -1;
    return phases.map((p, i) => ({ id: p.id, name: p.name, active: i === idx }));
  }, [phases, current]);

  return (
    <div className="w-full">
      {/* PHASE CONTEXT (passive, not navigation) */}
      <div className="flex items-center justify-center gap-5 mb-10 select-none">
        {phaseDots.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${p.active ? ui.dotOn : ui.dotOff}`} />
            <div className={`text-xs ${p.active ? ui.title : ui.sub}`}>{p.name}</div>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className={`text-3xl md:text-4xl font-semibold ${ui.title}`}>
          {done ? "All steps complete." : "Focus on one step."}
        </h2>
        <p className={`mt-2 ${ui.sub}`}>
          {done
            ? "You can revisit any step or reset to start fresh."
            : "Click any step to refocus. The path stays with you."}
        </p>
      </div>

      {/* ROADMAP (cognitive order: past -> present -> future) */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* PAST (behind - calm, settled) */}
        <div className="w-full max-w-[920px]">
          <div className={`text-[11px] uppercase tracking-wider ${ui.hint} mb-2`}>
            Behind
          </div>
          <div className="space-y-2">
            {past.length ? (
              past.map((s) => (
                <button
                  key={s.stepId}
                  onClick={() => focusStep(s.linearIndex)}
                  className={[
                    "w-full text-left rounded-xl border px-4 py-3 transition",
                    ui.frame,
                    ui.cardHover,
                    "opacity-60 hover:opacity-100",
                  ].join(" ")}
                  title="Click to revisit this step"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={`text-sm ${ui.title}`}>
                      <span className={`mr-2 ${ui.pastIndicator}`}>done</span>
                      {s.text || "Untitled step"}
                    </div>
                    <div className={`text-[11px] ${ui.sub}`}>{s.phaseName}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className={`text-sm ${ui.sub} opacity-70`}>No completed steps yet.</div>
            )}
          </div>
        </div>

        {/* CURRENT (focus - dominant) */}
        <div className="w-full max-w-[920px]">
          <div className={`text-[11px] uppercase tracking-wider ${ui.hint} mb-2`}>
            Now
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current ? current.stepId : "done"}
              initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
              transition={{ duration: 0.22 }}
              className={[
                "group w-full rounded-2xl border p-6 md:p-8 transition relative",
                ui.frame,
                "hover:border-slate-700/90",
              ].join(" ")}
            >
              {!done && current ? (
                <>
                  {/* top row */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className={ui.chip}>CURRENT STEP</span>

                    {/* controls appear on hover only */}
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-2">
                      <button
                        onClick={addStepBefore}
                        className={`px-3 py-1.5 rounded-full text-xs transition ${ui.ghost}`}
                        title="Add a step before"
                      >
                        + Before
                      </button>
                      <button
                        onClick={addStepAfter}
                        className={`px-3 py-1.5 rounded-full text-xs transition ${ui.ghost}`}
                        title="Add a step after"
                      >
                        + After
                      </button>
                      <button
                        onClick={removeCurrent}
                        className={`px-3 py-1.5 rounded-full text-xs transition ${ui.danger}`}
                        title="Remove current step"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* editable title */}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full text-left"
                      title="Click to edit"
                    >
                      <div className={`text-xl md:text-2xl font-medium ${ui.title}`}>
                        {current.text || "Untitled step"}
                      </div>
                      <div className={`text-xs mt-1 ${ui.sub}`}>
                        Click to edit · {current.phaseName}
                      </div>
                    </button>
                  ) : (
                    <div>
                      <input
                        autoFocus
                        value={current.text}
                        onChange={(e) => setStepText(current.stepId, e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setIsEditing(false);
                          if (e.key === "Escape") setIsEditing(false);
                        }}
                        className={`w-full bg-transparent outline-none text-xl md:text-2xl font-medium ${ui.input}`}
                        placeholder="Write the step..."
                      />
                      <div className={`text-xs mt-1 ${ui.sub}`}>Enter to finish editing</div>
                    </div>
                  )}

                  {/* primary action (single CTA) */}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    <button
                      onClick={completeCurrent}
                      className={`px-5 py-3 rounded-xl text-sm md:text-base font-medium transition ${ui.primary}`}
                    >
                      Mark complete
                    </button>

                    <div className={`text-xs md:text-sm ${ui.sub}`}>
                      Hover to add or remove steps
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className={`text-lg ${ui.sub}`}>
                    You can revisit any step above, or reset to start fresh.
                  </div>
                  {flat.length > 0 && (
                    <button
                      onClick={() => focusStep(Math.max(0, flat.length - 1))}
                      className={`mt-5 px-5 py-3 rounded-xl text-sm md:text-base font-medium transition ${ui.ghost}`}
                    >
                      Reopen last step
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FUTURE (ahead - silent, patient) */}
        <div className="w-full max-w-[920px]">
          <div className={`text-[11px] uppercase tracking-wider ${ui.hint} mb-2`}>
            Ahead
          </div>
          <div className="space-y-2">
            {future.length ? (
              future.map((s) => (
                <button
                  key={s.stepId}
                  onClick={() => focusStep(s.linearIndex)}
                  className={[
                    "w-full text-left rounded-xl border px-4 py-3 transition",
                    ui.frame,
                    ui.cardHover,
                    "opacity-50 hover:opacity-80",
                  ].join(" ")}
                  title="Click to focus on this step"
                >
                  <div className={`text-sm ${ui.title}`}>{s.text || "Untitled step"}</div>
                  <div className={`text-[11px] mt-0.5 ${ui.sub}`}>{s.phaseName}</div>
                </button>
              ))
            ) : (
              <div className={`text-sm ${ui.sub} opacity-70`}>
                {flat.length ? "No upcoming steps." : "No roadmap yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
