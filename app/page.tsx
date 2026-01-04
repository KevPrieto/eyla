"use client";

import { useEffect, useMemo, useState } from "react";
import Roadmap from "@/components/Roadmap";
import Sidebar from "@/components/Sidebar";
import ThoughtsView from "@/components/ThoughtsView";
import CalendarView from "@/components/CalendarView";
import type { Project, Thought, Phase, ThemeMode, ViewType } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { loadFromStorage } from "@/utils/migration";
import { useProjectActions } from "@/hooks/useProjects";
import { useThoughtActions } from "@/hooks/useThoughts";
import { useNotifications } from "@/hooks/useNotifications";

export default function Page() {
  // Core state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [isLoaded, setIsLoaded] = useState(false);

  // Input state for home view
  const [idea, setIdea] = useState("");

  // Hooks for project and thought operations
  const projectActions = useProjectActions(
    projects,
    setProjects,
    activeProjectId,
    setActiveProjectId
  );

  const thoughtActions = useThoughtActions(thoughts, setThoughts);

  // Notifications
  useNotifications({
    thoughts,
    projects,
    onDismissReminder: thoughtActions.dismissReminder,
  });

  // Derived state
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const hasRoadmap = activeProject !== null && activeProject.phases.length > 0;

  // Load from localStorage (with migration)
  useEffect(() => {
    const data = loadFromStorage();
    setProjects(data.projects);
    setThoughts(data.thoughts);
    setActiveProjectId(data.activeProjectId);
    setTheme(data.theme);

    setIsLoaded(true);
  }, []);

  // Persist theme changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
  }, [theme, isLoaded]);

  // UI styles
  const ui = useMemo(() => {
    const isDark = theme === "dark";
    return {
      page: isDark
        ? "min-h-screen bg-[radial-gradient(1400px_800px_at_50%_0%,rgba(56,189,248,0.16),transparent_62%),linear-gradient(to_bottom,#050b18,#060b16)] text-slate-100"
        : "min-h-screen bg-gradient-to-br from-[#EDE7F6] via-[#F3F8FF] to-[#E3F6F8] text-slate-800",
      canvas: "ml-[280px] min-h-screen flex justify-center",
      stage: "w-full max-w-[1280px] px-10 md:px-14 py-16",
      subtitle: isDark ? "text-slate-300/70" : "text-slate-600",
      input: isDark
        ? "w-full p-5 text-lg bg-transparent border border-slate-700/80 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600"
        : "w-full p-5 text-lg bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl outline-none placeholder:text-slate-400 focus:border-sky-300 text-slate-700",
      primary: isDark
        ? "mt-5 w-full py-4 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white"
        : "mt-5 w-full py-4 text-lg rounded-xl bg-sky-600 hover:bg-sky-700 transition text-white",
    };
  }, [theme]);

  // Start a new project
  function startProject() {
    if (!idea.trim()) return;

    projectActions.addProject(idea.trim(), idea.trim());
    setIdea("");
    setCurrentView("roadmap");
  }

  // Handle phase updates from Roadmap
  function handlePhasesChange(newPhases: Phase[]) {
    if (activeProjectId) {
      projectActions.updateProjectPhases(activeProjectId, newPhases);
    }
  }

  // Handle navigation
  function handleNavigate(view: ViewType) {
    setCurrentView(view);
  }

  // Reset everything (for debugging/development)
  function handleReset() {
    setProjects([]);
    setActiveProjectId(null);
    setThoughts([]);
    setCurrentView("home");
    setIdea("");
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    localStorage.removeItem(STORAGE_KEYS.THOUGHTS);
  }

  // Render the appropriate view
  function renderView() {
    // Thoughts view
    if (currentView === "thoughts") {
      return (
        <ThoughtsView
          thoughts={thoughts}
          projects={projects}
          onAddThought={thoughtActions.addThought}
          onDeleteThought={thoughtActions.deleteThought}
          onLinkToProject={thoughtActions.linkToProject}
          onScheduleThought={thoughtActions.scheduleThought}
          onUnscheduleThought={thoughtActions.unscheduleThought}
          onSetVisualNote={thoughtActions.setVisualNote}
          theme={theme}
        />
      );
    }

    // Calendar view
    if (currentView === "calendar") {
      return (
        <CalendarView
          thoughts={thoughts}
          projects={projects}
          onUnschedule={thoughtActions.unscheduleThought}
          onNavigateToThoughts={() => setCurrentView("thoughts")}
          theme={theme}
        />
      );
    }

    // Roadmap view (when project exists and selected)
    if (currentView === "roadmap" && activeProject) {
      return (
        <>
          {/* Header */}
          <header className="text-center mb-14 md:mb-16">
            <img
              src="/eyla-wordmark.png"
              alt="EYLA"
              className="h-auto mx-auto mb-3 object-contain"
              style={{ width: "clamp(200px, 35vw, 280px)" }}
            />
            <p className={`${ui.subtitle} text-base md:text-lg`}>
              One step at a time. The rest can wait.
            </p>
          </header>

          <Roadmap
            phases={activeProject.phases}
            setPhases={handlePhasesChange}
            thoughts={thoughts}
            onUpdateThought={thoughtActions.updateThought}
            theme={theme}
          />
        </>
      );
    }

    // Home view (no project or initial state)
    return (
      <>
        <header className="text-center mb-14 md:mb-16">
          <img
            src="/eyla-wordmark.png"
            alt="EYLA"
            className="h-auto mx-auto mb-3 object-contain"
            style={{ width: "clamp(200px, 35vw, 280px)" }}
          />
          <p className={`${ui.subtitle} text-base md:text-lg`}>
            What do you want to work on?
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startProject()}
            placeholder="Describe your project or idea..."
            className={ui.input}
          />
          <button onClick={startProject} className={ui.primary}>
            Start planning
          </button>
        </div>
      </>
    );
  }

  // Don't render until loaded (prevents flash)
  if (!isLoaded) {
    return null;
  }

  return (
    <main className={ui.page}>
      {/* SIDEBAR */}
      <Sidebar
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={projectActions.selectProject}
        onAddProject={() => {
          setCurrentView("home");
          setIdea("");
        }}
        onUpdateProjectStatus={projectActions.updateProjectStatus}
        thoughts={thoughts}
        currentView={currentView}
        onNavigate={handleNavigate}
        onReset={handleReset}
        getProjectProgress={projectActions.getProjectProgress}
      />

      {/* CANVAS */}
      <div className={ui.canvas}>
        <section className={ui.stage}>{renderView()}</section>
      </div>
    </main>
  );
}
