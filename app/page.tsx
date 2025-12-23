"use client";

import { useEffect, useState } from "react";
import Roadmap, { Phase } from "@/components/Roadmap";

function uid() {
  return crypto.randomUUID();
}

const STORAGE_KEY = "eyla-project";

function generateLocalRoadmap(): Phase[] {
  return [
    {
      id: uid(),
      name: "Planning",
      steps: [
        { id: uid(), text: "Define the problem", completed: false },
        { id: uid(), text: "Clarify the core idea", completed: false }
      ]
    },
    {
      id: uid(),
      name: "Design",
      steps: [
        { id: uid(), text: "Sketch main user flow", completed: false },
        { id: uid(), text: "Decide MVP scope", completed: false }
      ]
    },
    {
      id: uid(),
      name: "Development",
      steps: [
        { id: uid(), text: "Implement core logic", completed: false },
        { id: uid(), text: "Test interactions", completed: false }
      ]
    }
  ];
}

export default function Page() {
  const [idea, setIdea] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setIdea(parsed.idea ?? "");
      setPhases(parsed.phases ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ idea, phases }));
  }, [idea, phases]);

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
    <main className="min-h-screen bg-[#0b0f19] text-white px-6 py-20 flex flex-col items-center">
      <h1 className="text-4xl font-semibold mb-2 tracking-wide">EYLA</h1>
      <p className="text-gray-400 mb-12">Turn ideas into clear paths.</p>

      {phases.length === 0 && (
        <div className="w-full max-w-xl space-y-4">
          <input
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="Plan the new project launch"
            className="w-full p-4 rounded-xl bg-[#111827] border border-gray-700 text-lg focus:border-blue-500 transition"
          />
          <button
            onClick={start}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4 text-lg font-medium transition"
          >
            Start planning
          </button>
        </div>
      )}

      {phases.length > 0 && (
        <>
          <button
            onClick={reset}
            className="mb-10 text-sm text-gray-500 hover:text-gray-300 transition"
          >
            Reset project
          </button>

          <Roadmap phases={phases} setPhases={setPhases} />
        </>
      )}
    </main>
  );
}
