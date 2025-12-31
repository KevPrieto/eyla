"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Thought, Project, ThemeMode } from "@/types";
import { formatRelativeTime } from "@/utils/date";

interface ThoughtCardProps {
  thought: Thought;
  projects: Project[];
  onLinkProject: (projectId: string | undefined) => void;
  onSchedule: (timestamp: number) => void;
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
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState("");

  // Find linked project name
  const linkedProject = thought.projectId
    ? projects.find((p) => p.id === thought.projectId)
    : null;

  const ui = {
    // Glassmorphic card - cognitive presence
    card: isDark
      ? "rounded-[28px] border border-slate-800/50 bg-[#0b1220]/60 backdrop-blur-sm p-5"
      : "rounded-[28px] border border-white/50 bg-white/55 backdrop-blur-xl p-5 shadow-lg shadow-violet-200/25",

    // Content text - larger, more presence
    content: isDark
      ? "text-slate-100 text-base leading-relaxed"
      : "text-slate-700 text-base leading-relaxed",

    // Timestamp and meta - subtle
    meta: isDark
      ? "text-slate-500 text-xs mt-4"
      : "text-slate-400 text-xs mt-4",

    // Project tag
    projectTag: isDark
      ? "text-xs px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400"
      : "text-xs px-2 py-0.5 rounded-full bg-sky-100/70 text-sky-600",

    // Scheduled indicator
    scheduledTag: isDark
      ? "text-xs px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400"
      : "text-xs px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-600",

    // Icon buttons container - at bottom
    actions: isDark
      ? "flex items-center gap-1 mt-5 pt-4 border-t border-slate-800/50"
      : "flex items-center gap-1 mt-5 pt-4 border-t border-white/40",

    // Individual icon button
    iconButton: isDark
      ? "p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition"
      : "p-2.5 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-white/60 transition",

    // Active icon button (when scheduled or linked)
    iconButtonActive: isDark
      ? "p-2.5 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 transition"
      : "p-2.5 rounded-xl text-sky-500 hover:text-sky-600 hover:bg-sky-50/60 transition",

    // Delete button (special)
    deleteButton: isDark
      ? "p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition ml-auto"
      : "p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50/60 transition ml-auto",

    // Inline input for reminder
    inlineInput: isDark
      ? "mt-3 p-3 w-full rounded-xl bg-slate-900/50 border border-slate-700 text-slate-100 text-sm outline-none focus:border-slate-600"
      : "mt-3 p-3 w-full rounded-xl bg-white/70 border border-white/60 text-slate-700 text-sm outline-none focus:border-sky-300",

    // Inline select for project
    inlineSelect: isDark
      ? "mt-3 p-3 w-full rounded-xl bg-slate-900/50 border border-slate-700 text-slate-100 text-sm outline-none cursor-pointer"
      : "mt-3 p-3 w-full rounded-xl bg-white/70 border border-white/60 text-slate-700 text-sm outline-none cursor-pointer",

    // Inline action buttons
    inlineButton: isDark
      ? "px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
      : "px-3 py-1.5 text-xs rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition",

    inlineCancel: isDark
      ? "px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-200 transition"
      : "px-3 py-1.5 text-xs rounded-lg text-slate-500 hover:text-slate-700 transition",
  };

  // Handle reminder confirmation
  function handleReminderConfirm() {
    if (reminderDateTime) {
      const timestamp = new Date(reminderDateTime).getTime();
      if (!isNaN(timestamp)) {
        onSchedule(timestamp);
        setShowReminderInput(false);
        setReminderDateTime("");
      }
    }
  }

  // Get default datetime (1 hour from now)
  function getDefaultDateTime() {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Format scheduled time nicely
  function formatScheduledTime(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={ui.card}
    >
      {/* Thought content - PRIMARY */}
      <p className={ui.content}>{thought.text}</p>

      {/* Meta row - subtle */}
      <div className={`${ui.meta} flex items-center gap-2 flex-wrap`}>
        <span>{formatRelativeTime(thought.createdAt)}</span>
        {linkedProject && (
          <span className={ui.projectTag}>{linkedProject.name}</span>
        )}
        {thought.scheduledAt && (
          <span className={ui.scheduledTag}>
            {formatScheduledTime(thought.scheduledAt)}
          </span>
        )}
      </div>

      {/* Actions - ICONS at bottom */}
      <div className={ui.actions}>
        {/* Reminder button */}
        <button
          onClick={() => {
            if (thought.scheduledAt) {
              onUnschedule();
            } else {
              setShowReminderInput(!showReminderInput);
              setShowProjectSelect(false);
              if (!reminderDateTime) {
                setReminderDateTime(getDefaultDateTime());
              }
            }
          }}
          className={thought.scheduledAt ? ui.iconButtonActive : ui.iconButton}
          title={thought.scheduledAt ? "Remove reminder" : "Add reminder"}
        >
          {/* Bell icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Project link button */}
        <button
          onClick={() => {
            setShowProjectSelect(!showProjectSelect);
            setShowReminderInput(false);
          }}
          className={linkedProject ? ui.iconButtonActive : ui.iconButton}
          title={linkedProject ? "Change project" : "Link to project"}
        >
          {/* Folder icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </button>

        {/* Delete button - pushed to right */}
        <button
          onClick={onDelete}
          className={ui.deleteButton}
          title="Delete thought"
        >
          {/* Trash icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Inline reminder input */}
      <AnimatePresence>
        {showReminderInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <input
              type="datetime-local"
              value={reminderDateTime}
              onChange={(e) => setReminderDateTime(e.target.value)}
              className={ui.inlineInput}
              min={getDefaultDateTime()}
            />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={handleReminderConfirm} className={ui.inlineButton}>
                Set reminder
              </button>
              <button
                onClick={() => {
                  setShowReminderInput(false);
                  setReminderDateTime("");
                }}
                className={ui.inlineCancel}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline project select */}
      <AnimatePresence>
        {showProjectSelect && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <select
              value={thought.projectId || ""}
              onChange={(e) => {
                onLinkProject(e.target.value || undefined);
                setShowProjectSelect(false);
              }}
              className={ui.inlineSelect}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
