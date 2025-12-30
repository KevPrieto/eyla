"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Phase } from "@/components/Roadmap";

type ThemeMode = "dark" | "light";
type ViewType = "home" | "roadmap" | "notes";

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

interface SidebarProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  projectName: string;
  phases: Phase[];
  notes: Note[];
  hasRoadmap: boolean;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onReset: () => void;
}

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.2, ease: "easeOut" as const },
  }),
};

export default function Sidebar({
  theme,
  onThemeToggle,
  projectName,
  phases,
  notes,
  hasRoadmap,
  currentView,
  onNavigate,
  onReset,
}: SidebarProps) {
  const ui = {
    sidebar: "fixed left-0 top-0 h-screen w-[280px] bg-[#050b16] border-r border-slate-800",
    sectionLabel: "text-[11px] uppercase tracking-wider text-slate-500 mb-2",
    divider: "border-t border-slate-800/60 my-4",
    ghost: "text-xs text-slate-500 hover:text-slate-300 hover:scale-105 transition-all duration-150 cursor-pointer",
    navItem: "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer w-full text-left",
    navItemActive: "bg-slate-800/50 text-slate-100",
    navItemInactive: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30",
    navIcon: "w-4 h-4 opacity-70",
    // Glow/depth system for phases
    phaseBase: "flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200",
    phaseDot: "h-1.5 w-1.5 rounded-full transition-all duration-300",
    phaseDotActive: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]",
    phaseDotPast: "bg-slate-600",
    phaseDotFuture: "bg-slate-700",
    phaseText: "text-[11px] transition-all duration-200",
    phaseTextActive: "text-slate-300",
    phaseTextPast: "text-slate-600",
    phaseTextFuture: "text-slate-600",
    badge: "ml-auto text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded",
  };

  // Get current phase index for progress indicator
  const currentPhaseIndex = phases.findIndex((p) =>
    p.steps.some((s) => !s.completed)
  );

  // Determine phase state
  function getPhaseState(idx: number): "past" | "current" | "future" {
    if (currentPhaseIndex === -1) return "past"; // all done
    if (idx < currentPhaseIndex) return "past";
    if (idx === currentPhaseIndex) return "current";
    return "future";
  }

  return (
    <aside className={ui.sidebar}>
      <div className="h-full flex flex-col px-5 py-6">
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <img
            src="/eyla-spiral.png"
            alt="EYLA"
            className="h-12 w-auto object-contain"
          />
        </motion.div>

        {/* PROJECTS Section */}
        <motion.div
          className="mb-1"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className={ui.sectionLabel}>Projects</div>

          {hasRoadmap ? (
            <motion.button
              onClick={() => onNavigate("roadmap")}
              className={`${ui.navItem} ${currentView === "roadmap" ? ui.navItemActive : ui.navItemInactive}`}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className={ui.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm truncate flex-1">{projectName || "Untitled project"}</span>
            </motion.button>
          ) : (
            <div className="text-xs text-slate-600 italic px-3 py-2">
              No projects yet
            </div>
          )}

          {/* Mini phase indicator (only when in roadmap view) */}
          {hasRoadmap && currentView === "roadmap" && (
            <div className="mt-2 ml-3 flex items-center gap-1.5">
              {phases.map((phase, idx) => {
                const state = getPhaseState(idx);
                const dotClasses = {
                  past: ui.phaseDotPast,
                  current: ui.phaseDotActive,
                  future: ui.phaseDotFuture,
                };
                return (
                  <motion.div
                    key={phase.id}
                    className={`${ui.phaseDot} ${dotClasses[state]}`}
                    title={phase.name}
                    animate={state === "current" ? {
                      boxShadow: [
                        "0 0 0px rgba(34, 211, 238, 0.3)",
                        "0 0 8px rgba(34, 211, 238, 0.5)",
                        "0 0 0px rgba(34, 211, 238, 0.3)",
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          className={ui.divider}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        />

        {/* NOTES Section */}
        <motion.div
          className="mb-1"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className={ui.sectionLabel}>Notes</div>
          <motion.button
            onClick={() => onNavigate("notes")}
            className={`${ui.navItem} ${currentView === "notes" ? ui.navItemActive : ui.navItemInactive}`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className={ui.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm">All Notes</span>
            {notes.length > 0 && (
              <span className={ui.badge}>{notes.length}</span>
            )}
          </motion.button>
        </motion.div>

        <motion.div
          className={ui.divider}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />

        {/* UPCOMING Section (placeholder) */}
        <motion.div
          className="mb-1"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className={ui.sectionLabel}>Upcoming</div>
          <div className="text-xs text-slate-600 italic px-3 py-2">
            Coming soon
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <motion.div
          className="pt-4 border-t border-slate-800/60 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={onThemeToggle}
            className={ui.ghost}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Toggle theme
          </motion.button>
          {hasRoadmap && (
            <motion.button
              onClick={onReset}
              className={ui.ghost}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Reset
            </motion.button>
          )}
        </motion.div>
      </div>
    </aside>
  );
}
