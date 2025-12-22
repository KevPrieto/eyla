"use client";

import React from "react";

export interface Phase {
  name: string;
  steps: string[];
}

interface RoadmapProps {
  phases: Phase[];
}

export default function Roadmap({ phases }: RoadmapProps) {
  if (!phases || phases.length === 0) {
    return (
      <p className="text-gray-500 mt-10">
        No roadmap generated yet.
      </p>
    );
  }

  return (
    <div className="w-full max-w-4xl mt-16">
      {/* Timeline */}
      <svg
        viewBox="0 0 1000 200"
        className="w-full h-40 mb-16"
      >
        <path
          d="M 50 100 Q 300 20, 500 100 T 950 100"
          stroke="#3b82f6"
          strokeWidth="4"
          fill="none"
          opacity="0.6"
        />

        {phases.map((phase, index) => {
          const x =
            phases.length === 1
              ? 500
              : 50 + (index / (phases.length - 1)) * 900;

          return (
            <g key={index}>
              <circle
                cx={x}
                cy={100}
                r={16}
                fill="#0b0f19"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              <text
                x={x}
                y={105}
                textAnchor="middle"
                fontSize="12"
                fill="#e5e7eb"
              >
                {index + 1}
              </text>
              <text
                x={x}
                y={140}
                textAnchor="middle"
                fontSize="14"
                fill="#cbd5e1"
              >
                {phase.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Details */}
      <div className="space-y-10">
        {phases.map((phase, index) => (
          <div key={index}>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">
              {index + 1}. {phase.name}
            </h3>
            <ul className="space-y-2 pl-4">
              {phase.steps.map((step, i) => (
                <li
                  key={i}
                  className="text-gray-300 border-l border-blue-700 pl-4"
                >
                  {step}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
