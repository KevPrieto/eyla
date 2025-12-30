"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Thought, Project, ThemeMode } from "@/types";
import { formatDateTime, formatCalendarDate, isToday, isTomorrow, isPast } from "@/utils/date";

interface CalendarViewProps {
  thoughts: Thought[];
  projects: Project[];
  onUnschedule: (thoughtId: string) => void;
  onNavigateToThoughts: () => void;
  theme: ThemeMode;
}

interface GroupedThoughts {
  date: string;
  label: string;
  thoughts: Thought[];
  isPast: boolean;
}

export default function CalendarView({
  thoughts,
  projects,
  onUnschedule,
  onNavigateToThoughts,
  theme,
}: CalendarViewProps) {
  const isDark = theme === "dark";

  const ui = {
    title: isDark ? "text-slate-100" : "text-slate-900",
    sub: isDark ? "text-slate-400" : "text-slate-600",
    emptyState: isDark ? "text-slate-500" : "text-slate-400",
    dateLabel: isDark ? "text-slate-300 text-sm font-medium" : "text-slate-700 text-sm font-medium",
    dateLabelPast: isDark ? "text-slate-500 text-sm" : "text-slate-400 text-sm",
    card: isDark
      ? "rounded-xl border border-slate-800/70 bg-[#0b1220]/55 p-4 transition hover:border-slate-700/90"
      : "rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300",
    cardPast: isDark
      ? "rounded-xl border border-slate-800/50 bg-[#0b1220]/30 p-4 opacity-60"
      : "rounded-xl border border-slate-200/70 bg-slate-50 p-4 opacity-60",
    text: isDark ? "text-slate-100 text-sm" : "text-slate-900 text-sm",
    time: isDark ? "text-slate-500 text-xs" : "text-slate-400 text-xs",
    projectTag: isDark
      ? "text-[10px] px-2 py-0.5 rounded-full bg-cyan-900/30 text-cyan-400"
      : "text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-600",
    button: isDark
      ? "text-xs text-slate-500 hover:text-slate-300 transition"
      : "text-xs text-slate-400 hover:text-slate-700 transition",
    linkButton: isDark
      ? "text-sm text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
      : "text-sm text-slate-500 hover:text-slate-900 transition underline underline-offset-2",
  };

  // Get scheduled thoughts and group by date
  const groupedThoughts = useMemo(() => {
    const scheduled = thoughts.filter((t) => t.scheduledAt);

    // Sort by scheduled time
    const sorted = [...scheduled].sort((a, b) => a.scheduledAt! - b.scheduledAt!);

    // Group by date
    const groups: Map<string, Thought[]> = new Map();

    sorted.forEach((thought) => {
      const dateKey = formatCalendarDate(thought.scheduledAt!);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(thought);
    });

    // Convert to array with labels
    const result: GroupedThoughts[] = [];

    groups.forEach((thoughtsInGroup, dateKey) => {
      const timestamp = thoughtsInGroup[0].scheduledAt!;
      let label = dateKey;

      if (isToday(timestamp)) {
        label = "Today";
      } else if (isTomorrow(timestamp)) {
        label = "Tomorrow";
      }

      result.push({
        date: dateKey,
        label,
        thoughts: thoughtsInGroup,
        isPast: isPast(timestamp) && !isToday(timestamp),
      });
    });

    return result;
  }, [thoughts]);

  // Find project name helper
  function getProjectName(projectId?: string): string | null {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.name || null;
  }

  // Format time from timestamp
  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const hasScheduled = groupedThoughts.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-semibold ${ui.title}`}>Calendar</h1>
        <p className={`mt-1 ${ui.sub}`}>
          Scheduled reminders appear here. Nothing urgent, just gentle nudges.
        </p>
      </div>

      {/* Scheduled thoughts by date */}
      {hasScheduled ? (
        <div className="space-y-6">
          {groupedThoughts.map((group) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Date header */}
              <div className={`mb-3 ${group.isPast ? ui.dateLabelPast : ui.dateLabel}`}>
                {group.label}
                {group.label !== group.date && (
                  <span className="ml-2 opacity-60">{group.date}</span>
                )}
              </div>

              {/* Thoughts for this date */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {group.thoughts.map((thought) => (
                    <motion.div
                      key={thought.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={group.isPast ? ui.cardPast : ui.card}
                    >
                      {/* Time and text */}
                      <div className="flex items-start gap-3">
                        <span className={`${ui.time} min-w-[50px]`}>
                          {formatTime(thought.scheduledAt!)}
                        </span>
                        <div className="flex-1">
                          <p className={ui.text}>{thought.text}</p>

                          {/* Meta row */}
                          <div className="flex items-center gap-3 mt-2">
                            {/* Project tag */}
                            {thought.projectId && (
                              <span className={ui.projectTag}>
                                {getProjectName(thought.projectId)}
                              </span>
                            )}

                            {/* Unschedule button */}
                            <button
                              onClick={() => onUnschedule(thought.id)}
                              className={ui.button}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center py-12 ${ui.emptyState}`}
        >
          <p>No scheduled reminders.</p>
          <p className="text-sm mt-2">
            <button onClick={onNavigateToThoughts} className={ui.linkButton}>
              Schedule a thought
            </button>{" "}
            to see it here.
          </p>
        </motion.div>
      )}
    </div>
  );
}
