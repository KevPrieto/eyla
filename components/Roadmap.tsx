"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Step {
  id: string;
  text: string;
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

export default function Roadmap({ phases, setPhases }: RoadmapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  /* --- keep active phase in sync --- */
  useEffect(() => {
    if (!phases.length) {
      setActiveId(null);
    } else if (!activeId || !phases.some(p => p.id === activeId)) {
      setActiveId(phases[0].id);
    }
  }, [phases, activeId]);

  const activePhase = phases.find(p => p.id === activeId);
  if (!activePhase) return null;

  /* ---------- mutations ---------- */

  function addStep() {
    setPhases(prev =>
      prev.map(p =>
        p.id === activeId
          ? {
              ...p,
              steps: [
                ...p.steps,
                { id: crypto.randomUUID(), text: "New step" }
              ]
            }
          : p
      )
    );
  }

  function updateStep(id: string, text: string) {
    setPhases(prev =>
      prev.map(p =>
        p.id === activeId
          ? {
              ...p,
              steps: p.steps.map(s =>
                s.id === id ? { ...s, text } : s
              )
            }
          : p
      )
    );
  }

  function deleteStep(id: string) {
    setPhases(prev =>
      prev.map(p =>
        p.id === activeId
          ? { ...p, steps: p.steps.filter(s => s.id !== id) }
          : p
      )
    );
  }

  function moveStep(index: number, direction: "up" | "down") {
    setPhases(prev =>
      prev.map(p => {
        if (p.id !== activeId) return p;

        const steps = [...p.steps];
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= steps.length) return p;

        [steps[index], steps[target]] = [steps[target], steps[index]];
        return { ...p, steps };
      })
    );
  }

  /* ---------- UI ---------- */

  return (
    <section className="w-full max-w-4xl mt-16">
      {/* Phase selector */}
      <div className="flex gap-3 mb-10 flex-wrap">
        {phases.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={`px-4 py-2 rounded-full border transition ${
              p.id === activeId
                ? "border-blue-400 text-blue-300"
                : "border-gray-700 text-gray-400"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Active phase */}
      <div className="bg-[#111827] p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-semibold text-blue-400 mb-6">
          {activePhase.name}
        </h2>

        {/* IMPORTANT: layout on container */}
        <motion.div layout className="space-y-3">
          <AnimatePresence>
            {activePhase.steps.map((step, index) => (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center gap-3"
              >
                <span className="w-6 text-sm text-blue-400">
                  {index + 1}.
                </span>

                <input
                  value={step.text}
                  onChange={e => updateStep(step.id, e.target.value)}
                  className="flex-1 bg-[#0b0f19] border border-gray-700 rounded px-3 py-2"
                />

                <div className="flex gap-1">
                  <button
                    onClick={() => moveStep(index, "up")}
                    className="px-2 text-gray-400 hover:text-blue-400"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(index, "down")}
                    className="px-2 text-gray-400 hover:text-blue-400"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => deleteStep(step.id)}
                    className="px-2 text-red-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <button
          onClick={addStep}
          className="mt-4 text-blue-400 text-sm hover:underline"
        >
          + Add step
        </button>
      </div>
    </section>
  );
}
