"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThoughtCard from "./ThoughtCard";
import type { Thought, Project, ThemeMode } from "@/types";

interface ThoughtsViewProps {
  thoughts: Thought[];
  projects: Project[];
  onAddThought: (text: string) => void;
  onDeleteThought: (id: string) => void;
  onLinkToProject: (thoughtId: string, projectId: string | undefined) => void;
  onScheduleThought: (thoughtId: string, timestamp: number) => void;
  onUnscheduleThought: (thoughtId: string) => void;
  onSetVisualNote: (thoughtId: string, imageData: string | undefined) => void;
  theme: ThemeMode;
}

type FilterType = "all" | "scheduled" | "unscheduled";

export default function ThoughtsView({
  thoughts,
  projects,
  onAddThought,
  onDeleteThought,
  onLinkToProject,
  onScheduleThought,
  onUnscheduleThought,
  onSetVisualNote,
  theme,
}: ThoughtsViewProps) {
  const isDark = theme === "dark";
  const [newThought, setNewThought] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const ui = {
    title: isDark ? "text-slate-100" : "text-slate-800",
    sub: isDark ? "text-slate-400" : "text-slate-500",

    // Glassmorphic input
    input: isDark
      ? "w-full p-4 text-base bg-transparent border border-slate-700/80 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600 text-slate-100"
      : "w-full p-4 text-base bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl outline-none placeholder:text-slate-400 focus:border-sky-300 text-slate-700",

    emptyState: isDark ? "text-slate-500" : "text-slate-400",

    // Filter buttons - minimal, pill-like
    filterButton: "px-4 py-2 text-xs rounded-full transition",
    filterActive: isDark
      ? "bg-slate-800/60 text-slate-200"
      : "bg-white/70 text-slate-700 shadow-sm shadow-violet-200/20",
    filterInactive: isDark
      ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
      : "text-slate-400 hover:text-slate-600 hover:bg-white/40",
  };

  // Filter thoughts
  const filteredThoughts = useMemo(() => {
    let result = [...thoughts];

    switch (filter) {
      case "all":
        break;
      case "scheduled":
        result = result.filter((t) => t.scheduledAt);
        break;
      case "unscheduled":
        result = result.filter((t) => !t.scheduledAt);
        break;
    }

    // Sort newest first
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [thoughts, filter]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newThought.trim()) {
      onAddThought(newThought.trim());
      setNewThought("");
    }
  }

  // Count stats for filters
  const scheduledCount = thoughts.filter((t) => t.scheduledAt).length;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-semibold ${ui.title}`}>Thoughts</h1>
        <p className={`mt-1 ${ui.sub}`}>
          Capture ideas as they come. Decide later.
        </p>
      </div>

      {/* Quick capture - glassmorphic */}
      <form onSubmit={handleSubmit} className="mb-8">
        <input
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
          placeholder="Write a thought and press Enter..."
          className={ui.input}
          autoFocus
        />
      </form>

      {/* Filters - minimal pills */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setFilter("all")}
          className={`${ui.filterButton} ${
            filter === "all" ? ui.filterActive : ui.filterInactive
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("scheduled")}
          className={`${ui.filterButton} ${
            filter === "scheduled" ? ui.filterActive : ui.filterInactive
          }`}
        >
          Scheduled
        </button>
        <button
          onClick={() => setFilter("unscheduled")}
          className={`${ui.filterButton} ${
            filter === "unscheduled" ? ui.filterActive : ui.filterInactive
          }`}
        >
          Unscheduled
        </button>
      </div>

      {/* Thoughts - horizontal flow of cognitive cards */}
      <div className="flex flex-wrap gap-6 items-start">
        <AnimatePresence mode="popLayout">
          {filteredThoughts.length > 0 ? (
            filteredThoughts.map((thought, index) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03, duration: 0.25 }}
                className="w-[320px] shrink-0"
              >
                <ThoughtCard
                  thought={thought}
                  projects={projects}
                  onLinkProject={(projectId) => onLinkToProject(thought.id, projectId)}
                  onSchedule={(timestamp) => onScheduleThought(thought.id, timestamp)}
                  onUnschedule={() => onUnscheduleThought(thought.id)}
                  onSetVisualNote={(imageData) => onSetVisualNote(thought.id, imageData)}
                  onDelete={() => onDeleteThought(thought.id)}
                  theme={theme}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-16 ${ui.emptyState}`}
            >
              {filter === "all" ? (
                <>
                  <p className="text-lg">No thoughts yet.</p>
                  <p className="text-sm mt-2 opacity-70">
                    Start typing above to capture your first thought.
                  </p>
                </>
              ) : (
                <p>No thoughts match this filter.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
