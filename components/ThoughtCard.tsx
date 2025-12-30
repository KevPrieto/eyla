"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Thought, Project, ThemeMode } from "@/types";
import { formatRelativeTime, formatDateTime } from "@/utils/date";

interface ThoughtCardProps {
  thought: Thought;
  projects: Project[];
  onLinkProject: (projectId: string | undefined) => void;
  onSchedule: () => void;
  onUnschedule: () => void;
  onDelete: () => void;
  theme: ThemeMode;
}

export default function ThoughtCard({
  thought,
  projects,
  onLinkProject,
  onSchedule,
  onUnschedule,
  onDelete,
  theme,
}: ThoughtCardProps) {
  const isDark = theme === "dark";

  // Find linked project name
  const linkedProject = thought.projectId
    ? projects.find((p) => p.id === thought.projectId)
    : null;

  const ui = {
    card: isDark
      ? "rounded-xl border border-slate-800/70 bg-[#0b1220]/55 p-4 transition hover:border-slate-700/90"
      : "rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300",
    text: isDark ? "text-slate-100" : "text-slate-900",
    meta: isDark ? "text-slate-500 text-xs" : "text-slate-400 text-xs",
    tag: isDark
      ? "text-[10px] px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-400"
      : "text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500",
    tagActive: isDark
      ? "text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400"
      : "text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-600",
    button: isDark
      ? "text-xs text-slate-500 hover:text-slate-300 transition"
      : "text-xs text-slate-400 hover:text-slate-700 transition",
    select: isDark
      ? "text-xs bg-transparent border-none outline-none text-slate-400 cursor-pointer"
      : "text-xs bg-transparent border-none outline-none text-slate-500 cursor-pointer",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={ui.card}
    >
      {/* Thought text */}
      <div className={`${ui.text} text-sm mb-3`}>{thought.text}</div>

      {/* Meta row: tags + actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Created time */}
          <span className={ui.meta}>{formatRelativeTime(thought.createdAt)}</span>

          {/* Project link */}
          {linkedProject && (
            <span className={ui.tagActive}>{linkedProject.name}</span>
          )}

          {/* Scheduled time */}
          {thought.scheduledAt && (
            <span className={ui.tagActive}>
              {formatDateTime(thought.scheduledAt)}
            </span>
          )}
        </div>

        {/* Actions (subtle, appear on hover) */}
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition">
          {/* Project selector */}
          <select
            value={thought.projectId || ""}
            onChange={(e) => onLinkProject(e.target.value || undefined)}
            className={ui.select}
            title="Link to project"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Schedule button */}
          {thought.scheduledAt ? (
            <button onClick={onUnschedule} className={ui.button} title="Remove schedule">
              Unschedule
            </button>
          ) : (
            <button onClick={onSchedule} className={ui.button} title="Schedule a reminder">
              Schedule
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={onDelete}
            className={`${ui.button} hover:text-rose-400`}
            title="Delete thought"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}
