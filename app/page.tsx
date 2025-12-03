"use client";

import { useState } from "react";
import { Roadmap } from "@/components/Roadmap";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    
    const res = await fetch("/api/generate-roadmap", {
      method: "POST",
      body: JSON.stringify({ idea }),
    });

    const data = await res.json();
    setRoadmap(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold mb-6">NYRA</h1>
      <p className="text-gray-300 mb-6">Productivity, reimagined.</p>

      <input
        className="w-[350px] p-3 bg-[#111827] text-white rounded border border-gray-700 mb-4"
        placeholder="Describe your idea..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <button
        onClick={generate}
        className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Generating..." : "Generate Roadmap"}
      </button>

      <div className="mt-12 w-full flex justify-center">
        {roadmap && <Roadmap phases={roadmap.phases} />}
      </div>
    </main>
  );
}
