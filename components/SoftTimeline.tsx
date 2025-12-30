"use client";

import React, { useMemo } from "react";
import type { Phase, Step } from "@/components/Roadmap";

type ThemeMode = "dark" | "light";

type TimelineItem = {
  phaseName: string;
  phaseIndex: number;
  stepIndex: number;
  step: Step;
};

type SoftTimelineProps = {
  phases: Phase[];
  theme?: ThemeMode;
  maxNext?: number;
};

function flatten(phases: Phase[]): TimelineItem[] {
  const out: TimelineItem[] = [];
  for (let pi = 0; pi < phases.length; pi++) {
    const p = phases[pi];
    for (let si = 0; si < p.steps.length; si++) {
      out.push({ phaseName: p.name, phaseIndex: pi, stepIndex: si, step: p.steps[si] });
    }
  }
  return out;
}

export default function SoftTimeline({
  phases,
  theme = "dark",
  maxNext = 2,
}: SoftTimelineProps) {
  const flat = useMemo(() => flatten(phases), [phases]);

  const currentIndex = useMemo(() => {
    const idx = flat.findIndex((x) => !x.step.completed);
    return idx;
  }, [flat]);

  const now = useMemo(() => {
    if (!flat.length || currentIndex === -1) return null;
    return flat[currentIndex];
  }, [flat, currentIndex]);

  const next = useMemo(() => {
    if (!flat.length || currentIndex === -1) return [];
    return flat.slice(currentIndex + 1).filter((x) => !x.step.completed).slice(0, maxNext);
  }, [flat, currentIndex, maxNext]);

  const isDark = theme === "dark";

  return (
    <div className="select-none">
      <div className={`text-[11px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-500"}`}>
        Now
      </div>
      <div className="mt-1">
        {now ? (
          <>
            <div className={`text-sm leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              {now.step.text || "Untitled step"}
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              {now.phaseName}
            </div>
          </>
        ) : (
          <div className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            No current step.
          </div>
        )}
      </div>

      <div className={`my-3 border-t ${isDark ? "border-slate-800/60" : "border-slate-200/70"}`} />

      <div className={`text-[11px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-500"}`}>
        Next
      </div>
      <div className="mt-1 space-y-2">
        {next.length ? (
          next.map((it) => (
            <div key={it.step.id} className="group">
              <div className={`text-xs leading-snug opacity-90 group-hover:opacity-100 ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}>
                {it.step.text || "Untitled step"}
              </div>
              <div className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                {it.phaseName}
              </div>
            </div>
          ))
        ) : (
          <div className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
            Nothing queued.
          </div>
        )}
      </div>
    </div>
  );
}