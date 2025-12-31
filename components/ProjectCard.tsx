"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Project, ThemeMode } from "@/types";

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  progress: number;
  onClick: () => void;
  theme: ThemeMode;
}

export default function ProjectCard({
  project,
  isActive,
  progress,
  onClick,
  theme,
}: ProjectCardProps) {
  const isDark = theme === "dark";

  const ui = {
    card: `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer w-full text-left ${
      isActive
        ? isDark
          ? "bg-slate-800/50 text-slate-100"
          : "bg-white/60 text-slate-800 shadow-sm shadow-violet-200/20"
        : isDark
        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
    }`,
    icon: "w-4 h-4 opacity-70",
    name: "text-sm truncate flex-1",
    progress: isDark
      ? "text-[10px] text-slate-500"
      : "text-[10px] text-slate-400",
    statusDot: `h-1.5 w-1.5 rounded-full ${
      project.status === "active"
        ? "bg-emerald-500"
        : project.status === "paused"
        ? "bg-amber-500"
        : "bg-slate-500"
    }`,
  };

  return (
    <motion.button
      onClick={onClick}
      className={ui.card}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Project icon */}
      <svg
        className={ui.icon}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>

      {/* Project name */}
      <span className={ui.name}>{project.name || "Untitled project"}</span>

      {/* Progress percentage (muted, secondary) */}
      {progress > 0 && <span className={ui.progress}>{progress}%</span>}

      {/* Status indicator dot */}
      <div className={ui.statusDot} title={project.status} />
    </motion.button>
  );
}
