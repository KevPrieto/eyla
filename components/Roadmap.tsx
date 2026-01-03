"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function rebuildPhasesFromFlat(flat: FlatRef[], originalPhases: Phase[]): Phase[] {
  const newPhases: Phase[] = [];

  flat.forEach((step) => {
    let phase = newPhases.find((p) => p.name === step.phaseName);
    if (!phase) {
      const originalPhase = originalPhases.find((p) => p.name === step.phaseName);
      phase = {
        id: originalPhase?.id || uid(),
        name: step.phaseName,
        steps: [],
      };
      newPhases.push(phase);
    }
    phase.steps.push({
      id: step.stepId,
      text: step.text,
      completed: step.completed,
    });
  });

  return newPhases;
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

/* ---------- SortableStep Component ---------- */

interface SortableStepProps {
  step: FlatRef;
  index: number;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  isEditing: boolean;
  isHovered: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
  onTextChange: (text: string) => void;
  onFocus: () => void;
  onComplete: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  theme: ThemeMode;
}

function SortableStep({
  step,
  index,
  isCurrent,
  isPast,
  isFuture,
  isEditing,
  isHovered,
  onEdit,
  onStopEdit,
  onTextChange,
  onFocus,
  onComplete,
  onAdd,
  onRemove,
  onHoverStart,
  onHoverEnd,
  theme,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.stepId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDark = theme === "dark";

  const ui = {
    input: isDark ? "text-slate-100 placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400",
    primary: isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-sky-500 hover:bg-sky-600 text-white",
    ghost: isDark
      ? "text-slate-300/80 hover:text-slate-100 border border-slate-700/70 hover:bg-slate-900/40"
      : "text-slate-600 hover:text-slate-800 border border-white/60 hover:bg-white/60",
    danger: isDark
      ? "border border-rose-500/40 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
      : "border border-rose-200 text-rose-500 hover:bg-rose-50/60",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex justify-center my-4 cursor-grab active:cursor-grabbing"
    >
      <motion.div
        className={`w-full rounded-3xl px-6 py-5 transition-all duration-200 ${
          isDark ? "backdrop-blur-sm" : "backdrop-blur-xl"
        } ${
          isPast
            ? isDark
              ? "bg-slate-900/20 text-slate-500"
              : "bg-white/25 text-slate-400"
            : isCurrent
            ? isDark
              ? "bg-slate-800/40 text-slate-100 ring-1 ring-slate-700/30 shadow-lg shadow-slate-900/30"
              : "bg-white/60 text-slate-800 ring-1 ring-white/40 shadow-xl shadow-violet-200/30"
            : isDark
            ? "bg-slate-900/15 text-slate-600"
            : "bg-white/20 text-slate-500"
        }`}
        whileHover={{
          scale: 1.01,
          boxShadow: isDark
            ? "0 0 24px 4px rgba(56, 189, 248, 0.12)"
            : "0 0 28px 6px rgba(139, 92, 246, 0.15)",
        }}
        transition={{ duration: 0.2 }}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
      >
        {/* Step text */}
        {!isEditing || !isCurrent ? (
          <button
            onClick={isCurrent ? onEdit : onFocus}
            className="w-full text-left"
            title={isCurrent ? "Click to edit" : isPast ? "Click to revisit" : "Click to focus"}
          >
            <span className={isCurrent ? "text-lg font-medium" : "text-sm"}>
              {step.text || "Untitled"}
            </span>
          </button>
        ) : (
          <input
            autoFocus
            value={step.text}
            onChange={(e) => onTextChange(e.target.value)}
            onBlur={onStopEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onStopEdit();
            }}
            className={`w-full bg-transparent outline-none text-lg font-medium ${ui.input}`}
            placeholder="Write the step..."
          />
        )}

        {/* Action buttons - only visible when current */}
        <div
          className={`flex items-center gap-2 mt-4 transition-all duration-200 ${
            isCurrent ? "opacity-60 hover:opacity-100" : "opacity-0 h-0 overflow-hidden"
          }`}
        >
          <button
            onClick={onComplete}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition ${ui.primary}`}
          >
            Complete
          </button>
          <button
            onClick={onAdd}
            className={`px-3 py-2 rounded-xl text-sm transition ${ui.ghost}`}
            title="Add step"
          >
            +
          </button>
          <button
            onClick={onRemove}
            className={`px-3 py-2 rounded-xl text-sm transition ${ui.danger}`}
            title="Remove"
          >
            ×
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Main Roadmap Component ---------- */

export default function Roadmap({ phases, setPhases, theme = "dark" }: RoadmapProps) {
  const [flat, setFlat] = useState<FlatRef[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync flat state with phases
  useEffect(() => {
    setFlat(flatten(phases));
  }, [phases]);

  const currentLinearIndex = useMemo(() => {
    return firstIncompleteIndex(flat);
  }, [flat]);

  const done = useMemo(() => allDone(flat), [flat]);

  const current = useMemo(() => {
    if (!flat.length || currentLinearIndex === -1) return null;
    return flat[currentLinearIndex];
  }, [flat, currentLinearIndex]);

  const isDark = theme === "dark";

  const ui = useMemo(
    () =>
      isDark
        ? {
            title: "text-slate-100",
            sub: "text-slate-400",
            hint: "text-slate-500",
            fullscreenBg: "bg-[#050b18]",
            fullscreenButton: "text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/60",
            pathStroke: "#475569",
          }
        : {
            title: "text-slate-800",
            sub: "text-slate-500",
            hint: "text-slate-400",
            fullscreenBg: "bg-gradient-to-br from-[#EDE7F6] via-[#F3F8FF] to-[#E3F6F8]",
            fullscreenButton: "text-slate-600 hover:text-slate-800 bg-white/60 hover:bg-white/80",
            pathStroke: "#cbd5e1",
          },
    [isDark]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = flat.findIndex((s) => s.stepId === active.id);
      const newIndex = flat.findIndex((s) => s.stepId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(flat, oldIndex, newIndex);
        const newPhases = rebuildPhasesFromFlat(reordered, phases);
        setPhases(newPhases);
      }
    }
  }

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

  const progressPercent = useMemo(() => {
    if (flat.length === 0) return 0;
    const completed = flat.filter((s) => s.completed).length;
    return Math.round((completed / flat.length) * 100);
  }, [flat]);

  // ESC key handler
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  const roadmapContent = (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className={`text-2xl md:text-3xl font-semibold ${ui.title}`}>
          {done ? "Journey complete." : "Your path forward"}
        </h2>
        <p className={`mt-2 ${ui.sub}`}>
          {done
            ? "You can revisit any step or start fresh."
            : `${progressPercent}% complete · Drag to reorder`}
        </p>
      </div>

      {/* Path Container */}
      <div className="w-full max-w-lg mx-auto relative" ref={containerRef}>
        {/* Vertical Spine */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-0.5 pointer-events-none ${
            isDark
              ? "bg-gradient-to-b from-transparent via-slate-600/40 to-transparent"
              : "bg-gradient-to-b from-transparent via-slate-300/60 to-transparent"
          }`}
          style={{ zIndex: 0 }}
        />

        {/* Spine Glow - follows hovered step */}
        {hoveredIndex !== null && (
          <motion.div
            className={`absolute left-1/2 -translate-x-1/2 w-12 h-24 rounded-full blur-xl pointer-events-none ${
              isDark ? "bg-sky-400/15" : "bg-violet-500/12"
            }`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: `${hoveredIndex * 80 + 80}px`,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: 0 }}
          />
        )}

        {/* Steps */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={flat.map((s) => s.stepId)} strategy={verticalListSortingStrategy}>
            {flat.map((step, idx) => {
              const isNewPhase = idx === 0 || step.phaseIndex !== flat[idx - 1].phaseIndex;
              const isCurrent = step.linearIndex === currentLinearIndex;
              const isPast = step.completed;
              const isFuture = !step.completed && !isCurrent;

              return (
                <React.Fragment key={step.stepId}>
                  {isNewPhase && (
                    <div
                      className={`text-xs uppercase tracking-wider ${
                        idx === 0 ? "mb-4" : "mt-16 mb-4"
                      } ${ui.hint} text-center`}
                    >
                      {step.phaseName}
                    </div>
                  )}

                  <SortableStep
                    step={step}
                    index={idx}
                    isCurrent={isCurrent}
                    isPast={isPast}
                    isFuture={isFuture}
                    isEditing={isEditing && isCurrent}
                    isHovered={hoveredIndex === idx}
                    onEdit={() => setIsEditing(true)}
                    onStopEdit={() => setIsEditing(false)}
                    onTextChange={(text) => setStepText(step.stepId, text)}
                    onFocus={() => focusStep(step.linearIndex)}
                    onComplete={completeCurrent}
                    onAdd={addStepAfter}
                    onRemove={removeCurrent}
                    onHoverStart={() => setHoveredIndex(idx)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    theme={theme}
                  />
                </React.Fragment>
              );
            })}
          </SortableContext>
        </DndContext>

        {/* Done state */}
        {done && flat.length > 0 && (
          <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-700/50 bg-[#0b1220]/70 p-8 my-8 text-center">
            <div className={ui.title}>
              <div className="text-2xl mb-2">✓</div>
              <div className="text-lg font-medium">All complete</div>
              <button
                onClick={() => focusStep(Math.max(0, flat.length - 1))}
                className={`mt-4 px-4 py-2 rounded-xl text-sm transition ${isDark ? 'text-slate-300/80 hover:text-slate-100 border border-slate-700/70 hover:bg-slate-900/40' : 'text-slate-600 hover:text-slate-800 border border-white/60 hover:bg-white/60'}`}
              >
                Revisit last step
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Fullscreen Toggle Button */}
      {!isFullscreen && (
        <button
          onClick={() => setIsFullscreen(true)}
          className={`fixed top-4 right-4 z-40 p-2.5 rounded-xl transition ${ui.fullscreenButton} backdrop-blur-sm`}
          title="Enter fullscreen"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      )}

      {/* Normal Mode */}
      {!isFullscreen && roadmapContent}

      {/* Fullscreen Mode */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-50 ${ui.fullscreenBg} overflow-y-auto`}>
          <button
            onClick={() => setIsFullscreen(false)}
            className={`fixed top-4 right-4 z-50 p-2.5 rounded-xl transition ${ui.fullscreenButton} backdrop-blur-sm`}
            title="Exit fullscreen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="min-h-screen p-8">{roadmapContent}</div>
        </div>
      )}
    </>
  );
}
