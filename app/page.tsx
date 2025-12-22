"use client";

import { useState } from "react";
import Roadmap, { type Phase } from "@/components/Roadmap";

export default function Page() {
  const [idea, setIdea] = useState("");
  const [phases, setPhases] = useState<Phase[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateRoadmap() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      if (!res.ok) {
        throw new Error("API failed");
      }

      const data = await res.json();
      setPhases(data.phases);
    } catch (e) {
      // 🔥 FALLBACK LOCAL (CRÍTICO)
      setPhases([
        {
          name: "Planning",
          steps: [
            "Define the problem clearly",
            "Research similar products",
            "Set clear MVP scope",
          ],
        },
        {
          name: "Design",
          steps: [
            "Sketch core user flow",
            "Design minimal UI",
            "Validate clarity of steps",
          ],
        },
        {
          name: "Development",
          steps: [
            "Set up project structure",
            "Implement core logic",
            "Test basic flows",
          ],
        },
        {
          name: "Launch",
          steps: [
            "Prepare demo",
            "Collect early feedback",
            "Iterate based on insights",
          ],
        },
      ]);

      setError(
        "AI unavailable. Showing a local example roadmap."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center px-6 py-16">
      <h1 className="text-4xl font-bold mb-2">EYLA</h1>
      <p className="text-gray-400 mb-8">
        Turn ideas into clear paths.
      </p>

      <input
        className="w-full max-w-md p-3 bg-[#111827] border border-gray-700 rounded mb-4"
        placeholder="Create a successful MVP"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <button
        onClick={generateRoadmap}
        disabled={loading || !idea}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded transition"
      >
        {loading ? "Generating..." : "Generate Roadmap"}
      </button>

      {error && (
        <p className="text-yellow-400 mt-4 text-sm">
          {error}
        </p>
      )}

      {phases && <Roadmap phases={phases} />}
    </main>
  );
}
