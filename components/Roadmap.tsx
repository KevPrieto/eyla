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

/* ---------- Canvas Constants ---------- */

const STEP_WIDTH = 320;  // w-80

// Virtual canvas padding - creates large drag-safe area beyond content
const CANVAS_PADDING = {
  top: 1200,
  left: 1200,
  right: 1200,
  bottom: 1200,
};

// Minimum virtual canvas size (even if no steps)
const MIN_VIRTUAL_CANVAS = {
  width: 4000,   // ~3-4x typical viewport width
  height: 3000,  // ~3-4x typical viewport height
};

/* ---------- DraggableStep Component ---------- */

interface DraggableStepProps {
  step: FlatRef;
  linkedThoughts: Thought[];
  isSelected: boolean;
  onSelect: () => void;
  theme: ThemeMode;
  measureRef?: React.RefObject<HTMLDivElement | null>;
  onAddStep: () => void;
  onDeleteStep: () => void;
}

function DraggableStep({
  step,
  linkedThoughts,
  isSelected,
  onSelect,
  theme,
  measureRef,
  onAddStep,
  onDeleteStep,
}: DraggableStepProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: step.stepId,
    });

  const isDark = theme === "dark";

  // Apply origin offset to allow negative logical coordinates to render correctly
  const renderX = step.x + (transform?.x ?? 0) + CANVAS_PADDING.left;
  const renderY = step.y + (transform?.y ?? 0) + CANVAS_PADDING.top;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: "absolute",
        left: `${renderX}px`,
        top: `${renderY}px`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : isSelected ? 40 : 10,
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        ref={measureRef}
        onClick={onSelect}
        className={`w-80 rounded-3xl px-6 py-5 transition-all duration-200 backdrop-blur-xl ${
          step.completed
            ? isDark
              ? "bg-slate-900/30 text-slate-500 ring-1 ring-slate-700/20"
              : "bg-white/40 text-slate-400 ring-1 ring-slate-200/30"
            : isDark
            ? "bg-slate-800/50 text-slate-100 ring-1 ring-slate-700/40 shadow-lg shadow-blue-500/10"
            : "bg-white/70 text-slate-800 ring-1 ring-violet-200/50 shadow-xl shadow-violet-300/25"
        } ${
          isSelected
            ? isDark
              ? "ring-2 ring-cyan-400/60 shadow-cyan-400/20"
              : "ring-2 ring-violet-500/60 shadow-violet-400/25"
            : ""
        }`}
        whileHover={{
          scale: 1.02,
          boxShadow: isDark
            ? "0 0 32px 8px rgba(56, 189, 248, 0.18), 0 0 12px 2px rgba(59, 130, 246, 0.25)"
            : "0 0 36px 10px rgba(139, 92, 246, 0.22), 0 0 14px 3px rgba(167, 139, 250, 0.3)",
        }}
        transition={{ duration: 0.15 }}
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

        {/* Action buttons */}
        <div
          className={`mt-4 pt-4 flex items-center gap-2 border-t ${
            isDark ? "border-slate-700/30" : "border-slate-300/30"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddStep();
            }}
            className={`p-2 rounded-lg transition ${
              isDark
                ? "text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50"
                : "text-slate-400 hover:text-sky-600 hover:bg-white/60"
            }`}
            title="Add step after this"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteStep();
            }}
            className={`p-2 rounded-lg transition ${
              isDark
                ? "text-slate-500 hover:text-rose-400 hover:bg-rose-900/20"
                : "text-slate-400 hover:text-rose-500 hover:bg-rose-50/60"
            }`}
            title="Delete this step"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
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
  const [hasInitializedPan, setHasInitializedPan] = useState(false);
  const [stepHeight, setStepHeight] = useState(150);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepMeasureRef = useRef<HTMLDivElement>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  
  // Sync flat state with phases
  useEffect(() => {
    setFlat(flatten(phases));
  }, [phases]);

  // Measure step height dynamically from a stable step
  useEffect(() => {
    if (stepMeasureRef.current) {
      const height = stepMeasureRef.current.getBoundingClientRect().height;
      if (height > 0) setStepHeight(height);
    }
  }, [flat.length]);

  // Calculate center pan position for current content
  function calculateCenterPan(): { x: number; y: number } | null {
    if (flat.length === 0 || !containerRef.current) return null;

    const container = containerRef.current;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Skip if container not yet laid out
    if (viewportWidth === 0 || viewportHeight === 0) return null;

    // Find content bounds (logical coordinates)
    const minX = Math.min(...flat.map((s) => s.x));
    const maxX = Math.max(...flat.map((s) => s.x));
    const minY = Math.min(...flat.map((s) => s.y));
    const maxY = Math.max(...flat.map((s) => s.y));

    // Content center in render coordinates (with CANVAS_PADDING offset)
    const contentCenterX = ((minX + maxX) / 2) + CANVAS_PADDING.left + (STEP_WIDTH / 2);
    const contentCenterY = ((minY + maxY) / 2) + CANVAS_PADDING.top + (stepHeight / 2);

    // Viewport center
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;

    // Pan needed to center content (accounting for zoom)
    const panX = (viewportCenterX - contentCenterX) / zoom;
    const panY = (viewportCenterY - contentCenterY) / zoom;

    return { x: panX, y: panY };
  }

  // Center content on initial mount
  useEffect(() => {
    // Only run once when we have steps and container
    if (hasInitializedPan) return;

    const centerPan = calculateCenterPan();
    if (centerPan) {
      setPan(centerPan);
      setHasInitializedPan(true);
    }
  }, [flat, zoom, stepHeight, hasInitializedPan]);

  const isDark = theme === "dark";

  // Calculate virtual canvas bounds (large area for dragging)
  const canvasBounds = useMemo(() => {
    if (flat.length === 0) {
      return MIN_VIRTUAL_CANVAS;
    }

    // Find content bounds
    const minX = Math.min(...flat.map((s) => s.x));
    const maxX = Math.max(...flat.map((s) => s.x));
    const minY = Math.min(...flat.map((s) => s.y));
    const maxY = Math.max(...flat.map((s) => s.y));

    // Calculate virtual canvas with large padding
    const contentWidth = maxX - minX + STEP_WIDTH;
    const contentHeight = maxY - minY + stepHeight;

    const virtualWidth = contentWidth + CANVAS_PADDING.left + CANVAS_PADDING.right;
    const virtualHeight = contentHeight + CANVAS_PADDING.top + CANVAS_PADDING.bottom;

    return {
      width: Math.max(MIN_VIRTUAL_CANVAS.width, virtualWidth),
      height: Math.max(MIN_VIRTUAL_CANVAS.height, virtualHeight),
    };
  }, [flat, stepHeight]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;

    const stepId = active.id as string;
    const stepRef = flat.find((s) => s.stepId === stepId);
    if (!stepRef) return;

    // Calculate new logical position
    let newX = stepRef.x + delta.x;
    let newY = stepRef.y + delta.y;

    // Clamp to virtual canvas bounds (far outside viewport)
    const minX = -CANVAS_PADDING.left + 40;
    const maxX = canvasBounds.width - CANVAS_PADDING.right - STEP_WIDTH - 40;
    const minY = -CANVAS_PADDING.top + 40;
    const maxY = canvasBounds.height - CANVAS_PADDING.bottom - stepHeight - 40;

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));

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

    // Calculate center position for current content
    const centerPan = calculateCenterPan();
    if (centerPan) {
      setPan(centerPan);
    } else {
      // Fallback to origin if calculation fails
      setPan({ x: 0, y: 0 });
    }
  }

  // Add a new step after the current step
  function handleAddStep(phaseIndex: number, stepIndex: number) {
    const phase = phases[phaseIndex];
    if (!phase) return;

    const currentStep = phase.steps[stepIndex];

    // Create new step positioned below the current step
    const newStep: Step = {
      id: uid(),
      text: "New step",
      completed: false,
      x: currentStep?.x ?? 400,
      y: (currentStep?.y ?? 100) + 150, // 150px below
    };

    // Insert after current step
    const newPhases = phases.map((p, pi) => {
      if (pi !== phaseIndex) return p;

      const newSteps = [...p.steps];
      newSteps.splice(stepIndex + 1, 0, newStep);

      return { ...p, steps: newSteps };
    });

    setPhases(newPhases);
  }

  // Delete a step

  function handleDeleteStep(phaseIndex: number, stepIndex: number) {
    const phase = phases[phaseIndex];
    if (!phase || phase.steps.length === 1) {
      // Don't delete the last step in a phase
      return;
    }

    const newPhases = phases.map((p, pi) => {
      if (pi !== phaseIndex) return p;

      const newSteps = p.steps.filter((_, si) => si !== stepIndex);
      return { ...p, steps: newSteps };
    });

    setPhases(newPhases);

    // Clear selection if deleted step was selected
    const deletedStepId = phase.steps[stepIndex]?.id;
    if (selectedStepId === deletedStepId) {
      setSelectedStepId(null);
      setShowThoughtSelector(false);
    }
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
      {/* DEBUG OVERLAY - REMOVE AFTER FIX */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 left-[300px] z-[100] bg-black/80 text-green-400 text-xs font-mono p-2 rounded max-w-md">
          <div>phases: {phases.length}</div>
          <div>total steps: {phases.reduce((sum, p) => sum + p.steps.length, 0)}</div>
          <div>flat: {flat.length}</div>
          {flat[0] && (
            <>
              <div>step[0] logical: ({flat[0].x}, {flat[0].y})</div>
              <div>step[0] render: ({flat[0].x + CANVAS_PADDING.left}, {flat[0].y + CANVAS_PADDING.top})</div>
            </>
          )}
          <div>pan: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</div>
          <div>zoom: {zoom}</div>
          <div>container: {containerRef.current?.clientWidth ?? '?'}×{containerRef.current?.clientHeight ?? '?'}</div>
        </div>
      )}

      {/* Zoom Icon - Simple and Clean */}
      <button
        onClick={handleResetZoom}
        tabIndex={-1}
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
        className="relative w-full h-full overflow-hidden"
        style={{ pointerEvents: "auto" }}
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
            <defs>
              {/* Gradient for path connections */}
              <linearGradient id="eylaTrail" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(59,130,246,0.65)" />
                <stop offset="55%" stopColor="rgba(34,211,238,0.55)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.35)" />
              </linearGradient>

              {/* Soft glow filter */}
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0"
                  result="glow"
                />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {flat.map((step, idx) => {
              if (idx === flat.length - 1) return null;

              const next = flat[idx + 1];

              // Apply origin offset to path coordinates
              const x1 = step.x + 160 + CANVAS_PADDING.left;
              const y1 = step.y + 40 + CANVAS_PADDING.top;
              const x2 = next.x + 160 + CANVAS_PADDING.left;
              const y2 = next.y + 40 + CANVAS_PADDING.top;
              const midX = (x1 + x2) / 2;

              return (
                <path
                  key={`${step.stepId}-to-${next.stepId}`}
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  stroke="url(#eylaTrail)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#softGlow)"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Draggable Steps */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {flat.map((step) => {
              // Find stable step for measurement (first non-completed or first step)
              const stableStep = flat.find((s) => !s.completed) || flat[0];
              const shouldMeasure = step.stepId === stableStep?.stepId;

              return (
                <DraggableStep
                  key={step.stepId}
                  step={step}
                  linkedThoughts={thoughtsByStep.get(step.stepId) || []}
                  isSelected={selectedStepId === step.stepId}
                  onSelect={() => handleStepSelect(step.stepId)}
                  theme={theme}
                  measureRef={shouldMeasure ? stepMeasureRef : undefined}
                  onAddStep={() => handleAddStep(step.phaseIndex, step.stepIndex)}
                  onDeleteStep={() => handleDeleteStep(step.phaseIndex, step.stepIndex)}
                />
              );
            })}
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
