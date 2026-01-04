"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  useDraggable,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Phase, Step, Thought, ThemeMode } from "@/types";

// Re-export types for backwards compatibility
export type { Phase, Step };

type RoadmapProps = {
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
  thoughts: Thought[];
  onUpdateThought: (id: string, updates: Partial<Thought>) => void;
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
  x: number;
  y: number;
};

function flatten(phases: Phase[]): FlatRef[] {
  const out: FlatRef[] = [];
  let defaultY = 100;

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
        x: s.x ?? 400,
        y: s.y ?? defaultY,
      });
      defaultY += 150;
    }
  }
  return out;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ---------- DraggableStep Component ---------- */

interface DraggableStepProps {
  step: FlatRef;
  linkedThoughts: Thought[];
  isSelected: boolean;
  onSelect: () => void;
  theme: ThemeMode;
}

function DraggableStep({
  step,
  linkedThoughts,
  isSelected,
  onSelect,
  theme,
}: DraggableStepProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: step.stepId,
    });

  const isDark = theme === "dark";

  const x = step.x + (transform?.x ?? 0);
  const y = step.y + (transform?.y ?? 0);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : isSelected ? 40 : 10,
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        onClick={onSelect}
        className={`w-80 rounded-3xl px-6 py-5 transition-all duration-200 ${
          isDark ? "backdrop-blur-sm" : "backdrop-blur-xl"
        } ${
          step.completed
            ? isDark
              ? "bg-slate-900/20 text-slate-500"
              : "bg-white/25 text-slate-400"
            : isDark
            ? "bg-slate-800/40 text-slate-100 ring-1 ring-slate-700/30 shadow-lg shadow-slate-900/30"
            : "bg-white/60 text-slate-800 ring-1 ring-white/40 shadow-xl shadow-violet-200/30"
        } ${
          isSelected
            ? isDark
              ? "ring-2 ring-sky-500/50"
              : "ring-2 ring-violet-500/50"
            : ""
        }`}
        whileHover={{
          scale: 1.01,
          boxShadow: isDark
            ? "0 0 24px 4px rgba(56, 189, 248, 0.12)"
            : "0 0 28px 6px rgba(139, 92, 246, 0.15)",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Step text */}
        <div className={step.completed ? "text-sm" : "text-lg font-medium"}>
          {step.text || "Untitled"}
        </div>

        {/* Phase label */}
        <div
          className={`mt-1 text-xs uppercase tracking-wider ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {step.phaseName}
        </div>

        {/* Linked thoughts */}
        {linkedThoughts.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-slate-700/30 pt-3">
            {linkedThoughts.map((thought) => (
              <div
                key={thought.id}
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {thought.text}
                {thought.scheduledAt && (
                  <span
                    className={`ml-2 text-xs ${
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  >
                    📅 {formatTime(thought.scheduledAt)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ---------- ThoughtSelector Modal ---------- */

interface ThoughtSelectorProps {
  step: FlatRef;
  allThoughts: Thought[];
  onToggle: (thoughtId: string, stepId: string | undefined) => void;
  onClose: () => void;
  theme: ThemeMode;
}

function ThoughtSelector({
  step,
  allThoughts,
  onToggle,
  onClose,
  theme,
}: ThoughtSelectorProps) {
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-md w-full mx-4 rounded-2xl p-6 ${
          isDark
            ? "bg-slate-900 border border-slate-700"
            : "bg-white border border-slate-200"
        }`}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            isDark ? "text-slate-100" : "text-slate-800"
          }`}
        >
          Link thoughts to: {step.text}
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allThoughts.length === 0 ? (
            <p
              className={`text-sm ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              No thoughts available. Create some in the Thoughts view.
            </p>
          ) : (
            allThoughts.map((thought) => (
              <label
                key={thought.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                  isDark
                    ? "hover:bg-slate-800/50"
                    : "hover:bg-slate-100/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={thought.stepId === step.stepId}
                  onChange={() =>
                    onToggle(
                      thought.id,
                      thought.stepId === step.stepId ? undefined : step.stepId
                    )
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div
                    className={`text-sm ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {thought.text}
                  </div>
                  {thought.scheduledAt && (
                    <div
                      className={`text-xs mt-1 ${
                        isDark ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    >
                      📅 {formatTime(thought.scheduledAt)}
                    </div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className={`mt-4 w-full py-2 rounded-xl transition ${
            isDark
              ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          Done
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Main Roadmap Component ---------- */

export default function Roadmap({
  phases,
  setPhases,
  thoughts,
  onUpdateThought,
  theme = "dark",
}: RoadmapProps) {
  const [flat, setFlat] = useState<FlatRef[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showThoughtSelector, setShowThoughtSelector] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync flat state with phases
  useEffect(() => {
    setFlat(flatten(phases));
  }, [phases]);

  const isDark = theme === "dark";

  // Calculate canvas bounds
  const canvasBounds = useMemo(() => {
    if (flat.length === 0) return { width: 1200, height: 800 };

    const maxX = Math.max(...flat.map((s) => s.x)) + 400;
    const maxY = Math.max(...flat.map((s) => s.y)) + 200;

    return {
      width: Math.max(1200, maxX),
      height: Math.max(800, maxY),
    };
  }, [flat]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;

    const stepId = active.id as string;
    const stepRef = flat.find((s) => s.stepId === stepId);
    if (!stepRef) return;

    const newX = stepRef.x + delta.x;
    const newY = stepRef.y + delta.y;

    // Update step position in phases
    const newPhases = phases.map((p, pi) => {
      if (pi !== stepRef.phaseIndex) return p;
      return {
        ...p,
        steps: p.steps.map((s) =>
          s.id === stepId ? { ...s, x: newX, y: newY } : s
        ),
      };
    });

    setPhases(newPhases);
  }

  function handleStepSelect(stepId: string) {
    setSelectedStepId(stepId);
    setShowThoughtSelector(true);
  }

  function handleThoughtToggle(thoughtId: string, stepId: string | undefined) {
    onUpdateThought(thoughtId, { stepId });
  }

  // Get thoughts linked to each step
  const thoughtsByStep = useMemo(() => {
    const map = new Map<string, Thought[]>();
    thoughts.forEach((t) => {
      if (t.stepId) {
        if (!map.has(t.stepId)) map.set(t.stepId, []);
        map.get(t.stepId)!.push(t);
      }
    });
    return map;
  }, [thoughts]);

  const selectedStep = flat.find((s) => s.stepId === selectedStepId);

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 0.1, 2));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 0.1, 0.3));
  }

  function handleResetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  // Mouse wheel zoom
  function handleWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
    }
  }

  return (
    <>
      {/* Zoom Icon - Simple and Clean */}
      <button
        onClick={handleResetZoom}
        className={`fixed top-20 right-8 z-50 p-3 rounded-full transition-all ${
          isDark
            ? "text-slate-400 hover:text-slate-200"
            : "text-slate-500 hover:text-slate-700"
        }`}
        title="Scroll to zoom · Click to reset"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </button>

      {/* Canvas - Fully Integrated */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{
          height: "calc(100vh - 100px)",
        }}
        onWheel={handleWheel}
      >

        <div
          className="relative origin-top-left transition-transform duration-200"
          style={{
            width: `${canvasBounds.width}px`,
            height: `${canvasBounds.height}px`,
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          {/* Connection Lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasBounds.width}
            height={canvasBounds.height}
          >
            {flat.map((step, idx) => {
              if (idx === flat.length - 1) return null;

              const next = flat[idx + 1];
              const midX = (step.x + next.x) / 2;

              return (
                <path
                  key={`${step.stepId}-to-${next.stepId}`}
                  d={`M ${step.x + 160} ${step.y + 40} C ${midX} ${
                    step.y + 40
                  }, ${midX} ${next.y + 40}, ${next.x + 160} ${next.y + 40}`}
                  stroke={isDark ? "#475569" : "#cbd5e1"}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.4"
                />
              );
            })}
          </svg>

          {/* Draggable Steps */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {flat.map((step) => (
              <DraggableStep
                key={step.stepId}
                step={step}
                linkedThoughts={thoughtsByStep.get(step.stepId) || []}
                isSelected={selectedStepId === step.stepId}
                onSelect={() => handleStepSelect(step.stepId)}
                theme={theme}
              />
            ))}
          </DndContext>
        </div>
      </div>

      {/* Thought Selector Modal */}
      <AnimatePresence>
        {showThoughtSelector && selectedStep && (
          <ThoughtSelector
            step={selectedStep}
            allThoughts={thoughts}
            onToggle={handleThoughtToggle}
            onClose={() => setShowThoughtSelector(false)}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </>
  );
}
