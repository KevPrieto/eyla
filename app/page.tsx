"use client";

import { useEffect, useState } from "react";
import Roadmap, { Phase } from "@/components/Roadmap";

function uid() {
  return crypto.randomUUID();
}

function generateLocalRoadmap(): Phase[] {
  return [
    {
      id: uid(),
      name: "Planning",
      steps: [
        { id: uid(), text: "Define the problem" },
        { id: uid(), text: "Clarify the core idea" }
      ]
    },
    {
      id: uid(),
      name: "Design",
      steps: [
        { id: uid(), text: "Sketch main user flow" },
        { id: uid(), text: "Decide MVP scope" }
      ]
    },
    {
      id: uid(),
      name: "Development",
      steps: [
        { id: uid(), text: "Implement core logic" },
        { id: uid(), text: "Test interactions" }
      ]
    }
  ];
}

export default function Page() {
  const [idea, setIdea] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  function generate() {
    if (!idea.trim()) {
      setStatus("Write an idea first.");
      return;
    }
    setPhases(generateLocalRoadmap());
    setStatus("Local roadmap generated. Edit freely.");
  }

  function reset() {
    setPhases([]);
    setStatus(null);
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center px-6 py-16">
      <h1 className="text-4xl font-bold mb-2">EYLA</h1>
      <p className="text-gray-400 mb-10">Turn ideas into clear paths.</p>

      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          value={idea}
          onChange={e => setIdea(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()}
          placeholder="Describe your idea..."
          className="w-full p-3 rounded bg-[#111827] border border-gray-700 focus:outline-none focus:border-blue-500"
        />

        <div className="flex gap-3">
          <button
            onClick={generate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 rounded py-3 font-medium"
          >
            Generate roadmap
          </button>

          <button
            onClick={reset}
            disabled={!phases.length}
            className={`px-4 rounded py-3 border ${
              phases.length
                ? "border-gray-700 hover:border-gray-500"
                : "border-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Reset
          </button>
        </div>

        {status && (
          <p className="text-xs text-yellow-300">{status}</p>
        )}
      </div>

      {phases.length > 0 && (
        <Roadmap phases={phases} setPhases={setPhases} />
      )}
    </main>
  );
}
