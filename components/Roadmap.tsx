"use client";

import React from "react";

interface RoadmapProps {
  phases: {
    name: string;
    steps: string[];
  }[];
}

export function Roadmap({ phases }: RoadmapProps) {
  return (
    <div className="flex flex-col items-center w-full py-12">
      <svg
        width="90%"
        height="300px"
        viewBox="0 0 1000 300"
        className="text-blue-400"
      >
        <path
          d="M 50 150 Q 300 20, 500 150 T 950 150"
          stroke="rgba(120,160,255,0.35)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />

        <path
          d="M 50 150 Q 300 20, 500 150 T 950 150"
          stroke="url(#glow)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          className="animate-pulse"
        />

        <defs>
          <linearGradient id="glow">
            <stop offset="0%" stopColor="#4fa3ff" />
            <stop offset="100%" stopColor="#8ab4ff" />
          </linearGradient>
        </defs>

        {phases.map((phase, index) => {
          const x = 50 + (index / (phases.length - 1)) * 900;
          const y = 150;

          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r={22}
                fill="#111827"
                stroke="#4fa3ff"
                strokeWidth="3"
              />

              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="14"
                fill="#d8e6ff"
              >
                {index + 1}
              </text>

              <text
                x={x}
                y={y + 50}
                textAnchor="middle"
                fontSize="16"
                fill="#cbd5e1"
              >
                {phase.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-8 w-[80%] max-w-2xl">
        {phases.map((phase, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-xl font-semibold text-blue-300 mb-3">
              {index + 1}. {phase.name}
            </h2>

            <ul className="space-y-2 ml-4">
              {phase.steps.map((step, i) => (
                <li
                  key={i}
                  className="text-gray-300 border-l border-blue-800 pl-4 hover:text-blue-300 transition"
                >
                  • {step}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
