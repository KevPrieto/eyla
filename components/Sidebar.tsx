"use client";

import React from "react";
import { motion } from "framer-motion";
import ProjectCard from "./ProjectCard";
import type { Project, Thought, ThemeMode, ViewType, ProjectStatus } from "@/types";

interface SidebarProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
  onUpdateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  thoughts: Thought[];
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onReset: () => void;
  getProjectProgress: (project: Project) => number;
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
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onUpdateProjectStatus,
  thoughts,
  currentView,
  onNavigate,
  onReset,
  getProjectProgress,
}: SidebarProps) {
  const isDark = theme === "dark";

  const ui = {
    sidebar: isDark
      ? "fixed left-0 top-0 h-screen w-[280px] bg-[#050b16] border-r border-slate-800"
      : "fixed left-0 top-0 h-screen w-[280px] bg-slate-50 border-r border-slate-200",
    sectionLabel: isDark
      ? "text-[11px] uppercase tracking-wider text-slate-500 mb-2"
      : "text-[11px] uppercase tracking-wider text-slate-400 mb-2",
    divider: isDark
      ? "border-t border-slate-800/60 my-4"
      : "border-t border-slate-200 my-4",
    ghost: isDark
      ? "text-xs text-slate-500 hover:text-slate-300 hover:scale-105 transition-all duration-150 cursor-pointer"
      : "text-xs text-slate-400 hover:text-slate-600 hover:scale-105 transition-all duration-150 cursor-pointer",
    navItem: `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer w-full text-left`,
    navItemActive: isDark
      ? "bg-slate-800/50 text-slate-100"
      : "bg-slate-100 text-slate-900",
    navItemInactive: isDark
      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
    navIcon: "w-4 h-4 opacity-70",
    badge: isDark
      ? "ml-auto text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded"
      : "ml-auto text-[10px] text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded",
    addButton: isDark
      ? "flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded-lg transition-all w-full"
      : "flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all w-full",
    emptyText: isDark
      ? "text-xs text-slate-600 italic px-3 py-2"
      : "text-xs text-slate-400 italic px-3 py-2",
  };

  // Separate active projects from others
  const activeProjects = projects.filter((p) => p.status === "active");
  const pausedProjects = projects.filter((p) => p.status === "paused");
  const hasProjects = projects.length > 0;

  // Count scheduled thoughts
  const scheduledCount = thoughts.filter((t) => t.scheduledAt).length;

  return (
    <aside className={ui.sidebar}>
      <div className="h-full flex flex-col px-5 py-6">
        {/* NO LOGO - Removed per PRD v4.2 (sidebar is functional, not branded) */}

        {/* PROJECTS Section */}
        <motion.div
          className="mb-1"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className={ui.sectionLabel}>Projects</div>

          {/* Active projects */}
          {activeProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              progress={getProjectProgress(project)}
              onClick={() => {
                onSelectProject(project.id);
                onNavigate("roadmap");
              }}
              theme={theme}
            />
          ))}

          {/* Paused projects (collapsed section) */}
          {pausedProjects.length > 0 && (
            <div className="mt-2 opacity-60">
              {pausedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={project.id === activeProjectId}
                  progress={getProjectProgress(project)}
                  onClick={() => {
                    onSelectProject(project.id);
                    onNavigate("roadmap");
                  }}
                  theme={theme}
                />
              ))}
            </div>
          )}

          {/* No projects message */}
          {!hasProjects && (
            <div className={ui.emptyText}>No projects yet</div>
          )}

          {/* Add new project button */}
          <motion.button
            onClick={onAddProject}
            className={ui.addButton}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add new project</span>
          </motion.button>
        </motion.div>

        <motion.div
          className={ui.divider}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        />

        {/* THOUGHTS Section (renamed from Notes) */}
        <motion.div
          className="mb-1"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className={ui.sectionLabel}>Thoughts</div>
          <motion.button
            onClick={() => onNavigate("thoughts")}
            className={`${ui.navItem} ${
              currentView === "thoughts" ? ui.navItemActive : ui.navItemInactive
            }`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              className={ui.navIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-sm">All Thoughts</span>
            {thoughts.length > 0 && (
              <span className={ui.badge}>{thoughts.length}</span>
            )}
          </motion.button>
        </motion.div>

        <motion.div
          className={ui.divider}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />

        {/* CALENDAR Section (new) */}
        <motion.div
          className="mb-1"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <div className={ui.sectionLabel}>Calendar</div>
          <motion.button
            onClick={() => onNavigate("calendar")}
            className={`${ui.navItem} ${
              currentView === "calendar" ? ui.navItemActive : ui.navItemInactive
            }`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg
              className={ui.navIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Scheduled</span>
            {scheduledCount > 0 && (
              <span className={ui.badge}>{scheduledCount}</span>
            )}
          </motion.button>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <motion.div
          className={`pt-4 ${isDark ? "border-t border-slate-800/60" : "border-t border-slate-200"} flex items-center justify-between`}
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
            {isDark ? "Light mode" : "Dark mode"}
          </motion.button>
          {hasProjects && (
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
