"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

interface RoadmapProps {
  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
}

/* ---------- helpers ---------- */

function nextInPhase(phase: Phase | null) {
  if (!phase) return null;
  return phase.steps.find(s => !s.completed) ?? null;
}

function safeText(s?: string) {
  const t = (s ?? "").trim();
  return t.length ? t : "New step";
}

/* ---------- component ---------- */

export default function Roadmap({ phases, setPhases }: RoadmapProps) {
  const [activePhaseId, setActivePhaseId] = useState<string>(phases[0]?.id ?? "");
  const [launchOpen, setLaunchOpen] = useState(false);

  // keep activePhaseId always valid (prevents crashes on phase change)
  useEffect(() => {
    if (!phases.length) return;
    if (!activePhaseId || !phases.some(p => p.id === activePhaseId)) {
      setActivePhaseId(phases[0].id);
    }
  }, [phases, activePhaseId]);

  const activePhase = useMemo(
    () => phases.find(p => p.id === activePhaseId) ?? null,
    [phases, activePhaseId]
  );

  const nextStep = useMemo(() => nextInPhase(activePhase), [activePhase]);

  const focusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [nextStep?.id, activePhaseId]);

  if (!activePhase) return null;

  const steps = activePhase.steps;
  const doneCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length || 1;
  const progress = doneCount / totalCount;
  const phaseCompleted = steps.length > 0 && steps.every(s => s.completed);

  /* ---------- mutations ---------- */

  function updateStep(stepId: string, text: string) {
    setPhases(prev =>
      prev.map(p =>
        p.id === activePhaseId
          ? { ...p, steps: p.steps.map(s => (s.id === stepId ? { ...s, text } : s)) }
          : p
      )
    );
  }

  function toggleComplete(stepId: string) {
    setPhases(prev =>
      prev.map(p =>
        p.id === activePhaseId
          ? {
              ...p,
              steps: p.steps.map(s =>
                s.id === stepId ? { ...s, completed: !s.completed } : s
              )
            }
          : p
      )
    );
  }

  function addStep(afterIndex: number) {
    setPhases(prev =>
      prev.map(p =>
        p.id === activePhaseId
          ? {
              ...p,
              steps: [
                ...p.steps.slice(0, afterIndex + 1),
                { id: crypto.randomUUID(), text: "New step", completed: false },
                ...p.steps.slice(afterIndex + 1)
              ]
            }
          : p
      )
    );
  }

  function removeStep(stepId: string) {
    setPhases(prev =>
      prev.map(p =>
        p.id === activePhaseId
          ? { ...p, steps: p.steps.filter(s => s.id !== stepId) }
          : p
      )
    );
  }

  /* ---------- UI ---------- */

  return (
    <section className="w-full max-w-5xl relative">
      {/* defs for “aura” */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="eylaTrail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(59,130,246,0.65)" />
            <stop offset="55%" stopColor="rgba(34,211,238,0.55)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.35)" />
          </linearGradient>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.35 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* PHASE PILLS */}
      <div className="flex justify-center gap-3 mb-10">
        {phases.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePhaseId(p.id)}
            className={`px-4 py-2 rounded-full border transition-all duration-200 hover:scale-[1.03] ${
              p.id === activePhaseId
                ? "border-blue-400 text-blue-300 shadow-blue-500/10 shadow-lg"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* FOCUS */}
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Focus now</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={nextStep?.id ?? `done-${activePhaseId}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <h2 className="text-4xl font-semibold text-blue-300">
              {nextStep ? safeText(nextStep.text) : "Phase completed"}
            </h2>
            <div className="mt-3 text-sm text-gray-400">
              {nextStep ? "This step unlocks momentum. Keep going." : "Everything is done here. You can launch."}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* PROGRESS */}
      <div className="w-full max-w-xl mx-auto mb-14">
        <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: "linear-gradient(90deg, rgba(59,130,246,0.9), rgba(34,211,238,0.8))"
            }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          {doneCount}/{steps.length} completed
        </div>
      </div>

      {/* PATH LIST */}
      <div className="relative flex flex-col items-center gap-16 pb-10">
        {steps.map((step, i) => {
          const isNext = nextStep?.id === step.id;

          // subtle zigzag to feel like a “trail”
          const side = i % 2 === 0 ? -1 : 1;
          const x = side * 56;

          const hasNext = i < steps.length - 1;
          const curveDir = side;

          // node + ring aura
          const nodeBase =
            step.completed ? "bg-cyan-300" : isNext ? "bg-blue-400" : "bg-white/20";
          const ring =
            step.completed ? "ring-2 ring-cyan-300/25" : isNext ? "ring-2 ring-blue-400/35" : "ring-1 ring-white/15";

          // card emphasis
          const cardBorder = isNext ? "border-blue-400" : "border-white/10";
          const cardHover = "hover:border-white/20 hover:shadow-xl hover:shadow-blue-500/5";

          // connector color by state of CURRENT step (segment leaving it)
          const segmentKind = step.completed ? "completed" : isNext ? "active" : "future";

          return (
            <div key={step.id} className="relative w-full flex justify-center">
              <motion.div
                ref={isNext ? focusRef : null}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: step.completed ? 0.92 : 1, y: 0, scale: isNext ? 1.02 : 1 }}
                transition={{ duration: 0.25 }}
                whileHover={{ scale: 1.03 }}
                className="relative"
                style={{ transform: `translateX(${x}px)` }}
              >
                {/* NODE */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                  <motion.div
                    className={`w-3.5 h-3.5 rounded-full ${nodeBase} ${ring} shadow-lg`}
                    style={{ filter: "drop-shadow(0 0 14px rgba(59,130,246,0.18))" }}
                    animate={isNext ? { scale: [1, 1.25, 1] } : {}}
                    transition={isNext ? { repeat: Infinity, duration: 1.2 } : {}}
                  />
                </div>

                {/* CARD */}
                <div
                  className={`bg-[#111827]/80 backdrop-blur-sm border ${cardBorder} ${cardHover} rounded-2xl px-10 py-6 w-[34rem] transition-all`}
                >
                  <input
                    value={step.text}
                    onChange={e => updateStep(step.id, e.target.value)}
                    className="w-full bg-transparent outline-none text-center text-lg font-medium placeholder:text-gray-600"
                    placeholder="Describe this step..."
                  />

                  {/* ACTIONS */}
                  <div className="mt-5 flex items-center justify-between">
                    <button
                      onClick={() => addStep(i)}
                      className="text-sm px-3 py-2 rounded-lg text-blue-200 hover:text-blue-100 hover:bg-blue-500/10 transition"
                      title="Add a step after this one"
                    >
                      + Add step
                    </button>

                    <button
                      onClick={() => toggleComplete(step.id)}
                      className={`text-sm px-5 py-2 rounded-full font-semibold transition ${
                        step.completed
                          ? "bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
                          : "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
                      }`}
                      title={step.completed ? "Reopen this step" : "Mark as done"}
                    >
                      {step.completed ? "REOPEN" : "DONE"}
                    </button>

                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-sm px-3 py-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 transition"
                      title="Remove this step"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* CONNECTOR CURVE (the “mystic trail”) */}
              {hasNext && (
                <svg
                  className="absolute left-1/2 -translate-x-1/2 top-[96px] pointer-events-none"
                  width="190"
                  height="120"
                  viewBox="0 0 190 120"
                  aria-hidden="true"
                >
                  {/* faint base trail */}
                  <path
                    d={
                      curveDir === -1
                        ? "M95 0 C 42 32, 148 86, 95 120"
                        : "M95 0 C 148 32, 42 86, 95 120"
                    }
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* colored trail */}
                  <motion.path
                    d={
                      curveDir === -1
                        ? "M95 0 C 42 32, 148 86, 95 120"
                        : "M95 0 C 148 32, 42 86, 95 120"
                    }
                    fill="none"
                    stroke={
                      segmentKind === "completed"
                        ? "rgba(34,211,238,0.55)"
                        : segmentKind === "active"
                        ? "url(#eylaTrail)"
                        : "rgba(59,130,246,0.22)"
                    }
                    strokeWidth={segmentKind === "active" ? 2.6 : 2}
                    strokeLinecap="round"
                    strokeDasharray={segmentKind === "future" ? "6 10" : "0"}
                    filter={segmentKind === "active" ? "url(#softGlow)" : undefined}
                    animate={
                      segmentKind === "active"
                        ? { strokeDashoffset: [0, -22] }
                        : {}
                    }
                    transition={
                      segmentKind === "active"
                        ? { repeat: Infinity, duration: 1.6, ease: "linear" }
                        : {}
                    }
                  />
                </svg>
              )}
            </div>
          );
        })}

        {/* LAUNCH (no alert, cinematic overlay) */}
        <motion.button
          disabled={!phaseCompleted}
          whileHover={phaseCompleted ? { scale: 1.05 } : {}}
          whileTap={phaseCompleted ? { scale: 0.98 } : {}}
          className={`mt-10 px-10 py-3 rounded-full border transition-all text-sm font-semibold tracking-wide ${
            phaseCompleted
              ? "border-blue-400 text-blue-200 hover:bg-blue-500/10 shadow-blue-500/10 shadow-xl"
              : "border-white/10 text-gray-600 cursor-not-allowed"
          }`}
          title={phaseCompleted ? "Ready to launch" : "Complete this phase to unlock launch"}
          onClick={() => {
            if (!phaseCompleted) return;
            setLaunchOpen(true);
          }}
        >
          Launch
        </motion.button>
      </div>

      {/* LAUNCH OVERLAY (soft, not intrusive) */}
      <AnimatePresence>
        {launchOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setLaunchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1220] p-8 shadow-2xl shadow-blue-500/10"
            >
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                Launch moment
              </div>
              <div className="text-3xl font-semibold text-blue-300">
                You’re ready.
              </div>
              <p className="mt-3 text-gray-400">
                This is the start of execution. Next: a cinematic launch flow + project dashboard.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setLaunchOpen(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  onClick={() => setLaunchOpen(false)}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

