"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThoughtCard from "./ThoughtCard";
import ScheduleModal from "./ScheduleModal";
import type { Thought, Project, ThemeMode } from "@/types";

interface ThoughtsViewProps {
  thoughts: Thought[];
  projects: Project[];
  onAddThought: (text: string) => void;
  onDeleteThought: (id: string) => void;
  onLinkToProject: (thoughtId: string, projectId: string | undefined) => void;
  onScheduleThought: (thoughtId: string, timestamp: number) => void;
  onUnscheduleThought: (thoughtId: string) => void;
  theme: ThemeMode;
}

type FilterType = "all" | "scheduled" | "unscheduled" | string; // string for project IDs

export default function ThoughtsView({
  thoughts,
  projects,
  onAddThought,
  onDeleteThought,
  onLinkToProject,
  onScheduleThought,
  onUnscheduleThought,
  theme,
}: ThoughtsViewProps) {
  const isDark = theme === "dark";
  const [newThought, setNewThought] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingThoughtId, setSchedulingThoughtId] = useState<string | null>(null);

  const ui = {
    title: isDark ? "text-slate-100" : "text-slate-900",
    sub: isDark ? "text-slate-400" : "text-slate-600",
    input: isDark
      ? "w-full p-4 text-base bg-transparent border border-slate-700/80 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600 text-slate-100"
      : "w-full p-4 text-base bg-transparent border border-slate-200 rounded-xl outline-none placeholder:text-slate-400 focus:border-slate-400 text-slate-900",
    emptyState: isDark ? "text-slate-500" : "text-slate-400",
    filterButton: isDark
      ? "px-3 py-1.5 text-xs rounded-lg transition"
      : "px-3 py-1.5 text-xs rounded-lg transition",
    filterActive: isDark
      ? "bg-slate-800/60 text-slate-200"
      : "bg-slate-100 text-slate-900",
    filterInactive: isDark
      ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
    filterDropdown: isDark
      ? "px-3 py-1.5 text-xs rounded-lg bg-transparent border border-slate-700 text-slate-400 outline-none cursor-pointer"
      : "px-3 py-1.5 text-xs rounded-lg bg-transparent border border-slate-200 text-slate-600 outline-none cursor-pointer",
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
      default:
        // Filter by project ID
        result = result.filter((t) => t.projectId === filter);
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

  function openScheduleModal(thoughtId: string) {
    setSchedulingThoughtId(thoughtId);
    setScheduleModalOpen(true);
  }

  function handleScheduleConfirm(timestamp: number) {
    if (schedulingThoughtId) {
      onScheduleThought(schedulingThoughtId, timestamp);
    }
    setScheduleModalOpen(false);
    setSchedulingThoughtId(null);
  }

  function handleScheduleCancel() {
    setScheduleModalOpen(false);
    setSchedulingThoughtId(null);
  }

  const schedulingThought = schedulingThoughtId
    ? thoughts.find((t) => t.id === schedulingThoughtId)
    : null;

  // Count stats for filters
  const scheduledCount = thoughts.filter((t) => t.scheduledAt).length;
  const linkedProjects = projects.filter((p) =>
    thoughts.some((t) => t.projectId === p.id)
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold ${ui.title}`}>Thoughts</h1>
        <p className={`mt-1 ${ui.sub}`}>
          Capture ideas as they come. Link them to projects or schedule reminders.
        </p>
      </div>

      {/* Quick capture */}
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
          placeholder="Write a thought and press Enter..."
          className={ui.input}
          autoFocus
        />
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`${ui.filterButton} ${
            filter === "all" ? ui.filterActive : ui.filterInactive
          }`}
        >
          All ({thoughts.length})
        </button>
        <button
          onClick={() => setFilter("scheduled")}
          className={`${ui.filterButton} ${
            filter === "scheduled" ? ui.filterActive : ui.filterInactive
          }`}
        >
          Scheduled ({scheduledCount})
        </button>
        <button
          onClick={() => setFilter("unscheduled")}
          className={`${ui.filterButton} ${
            filter === "unscheduled" ? ui.filterActive : ui.filterInactive
          }`}
        >
          Unscheduled ({thoughts.length - scheduledCount})
        </button>

        {/* Project filter dropdown */}
        {linkedProjects.length > 0 && (
          <select
            value={filter.startsWith("proj-") ? filter : ""}
            onChange={(e) => setFilter(e.target.value || "all")}
            className={ui.filterDropdown}
          >
            <option value="">By project...</option>
            {linkedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Thoughts list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredThoughts.length > 0 ? (
            filteredThoughts.map((thought) => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                projects={projects}
                onLinkProject={(projectId) => onLinkToProject(thought.id, projectId)}
                onSchedule={() => openScheduleModal(thought.id)}
                onUnschedule={() => onUnscheduleThought(thought.id)}
                onDelete={() => onDeleteThought(thought.id)}
                theme={theme}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-12 ${ui.emptyState}`}
            >
              {filter === "all" ? (
                <>
                  <p>No thoughts yet.</p>
                  <p className="text-sm mt-1">
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

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        thoughtText={schedulingThought?.text || ""}
        currentSchedule={schedulingThought?.scheduledAt}
        onConfirm={handleScheduleConfirm}
        onCancel={handleScheduleCancel}
        theme={theme}
      />
    </div>
  );
}
