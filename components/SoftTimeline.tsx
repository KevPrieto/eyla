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
    return flat.findIndex((x) => !x.step.completed);
  }, [flat]);

  const now = useMemo(() => {
    if (!flat.length || currentIndex === -1) return null;
    return flat[currentIndex];
  }, [flat, currentIndex]);

  const next = useMemo(() => {
    if (!flat.length || currentIndex === -1) return [];
    return flat.slice(currentIndex + 1).filter((x) => !x.step.completed).slice(0, maxNext);
  }, [flat, currentIndex, maxNext]);

  const progress = useMemo(() => {
    if (!flat.length) return 0;
    const completed = flat.filter((x) => x.step.completed).length;
    return Math.round((completed / flat.length) * 100);
  }, [flat]);

  const isDark = theme === "dark";

  const colors = {
    hint: "text-slate-500",
    primary: isDark ? "text-slate-200" : "text-slate-800",
    secondary: "text-slate-500",
    divider: isDark ? "border-slate-800/60" : "border-slate-200/70",
    progress: isDark ? "bg-cyan-500/30" : "bg-violet-400/30",
  };

  // Calculate overall progress percentage
  const progress = useMemo(() => {
    if (!flat.length) return 0;
    const completed = flat.filter((x) => x.step.completed).length;
    return Math.round((completed / flat.length) * 100);
  }, [flat]);

  return (
    <div className="select-none">
      {/* Progress indicator - subtle, non-celebratory */}
      {flat.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div
                className={`h-full transition-all duration-500 ${colors.progress}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={`text-[10px] ${colors.hint}`}>{progress}%</span>
          </div>
        </div>
      )}

      <div className={`text-[11px] uppercase tracking-wider ${colors.hint}`}>
        Now
      </div>
      <div className="mt-1">
        {now ? (
          <>
            <div className={`text-sm leading-snug ${colors.primary}`}>
              {now.step.text || "Untitled step"}
            </div>
            <div className={`text-[11px] mt-0.5 ${colors.secondary}`}>
              {now.phaseName}
            </div>
          </>
        ) : (
          <div className={`text-xs ${colors.secondary}`}>
            No current step.
          </div>
        )}
      </div>

      <div className={`my-3 border-t ${colors.divider}`} />

      <div className={`text-[11px] uppercase tracking-wider ${colors.hint}`}>
        Next
      </div>
      <div className="mt-1 space-y-2">
        {next.length ? (
          next.map((it) => (
            <div key={it.step.id} className="group">
              <div className={`text-xs leading-snug opacity-60 group-hover:opacity-80 ${colors.primary}`}>
                {it.step.text || "Untitled step"}
              </div>
              <div className={`text-[11px] mt-0.5 ${colors.secondary}`}>
                {it.phaseName}
              </div>
            </div>
          ))
        ) : (
          <div className={`text-xs ${colors.secondary}`}>
            Nothing queued.
          </div>
        )}
      </div>

      <div className={`my-3 border-t ${colors.divider}`} />

      <div className={`text-[11px] uppercase tracking-wider ${colors.hint} mb-2`}>
        Progress
      </div>
      <div className={`h-1 rounded-full overflow-hidden ${colors.progressBg}`}>
        <div
          className={`h-full transition-all duration-300 ${colors.progressFill}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className={`text-[10px] mt-1 ${colors.secondary}`}>
        {completedCount} of {totalSteps} steps
      </div>
    </div>
  );
}
