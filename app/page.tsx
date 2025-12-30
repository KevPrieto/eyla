"use client";

import { useEffect, useMemo, useState } from "react";
import Roadmap, { Phase } from "@/components/Roadmap";
import Sidebar from "@/components/Sidebar";
import NotesView from "@/components/NotesView";

type ThemeMode = "dark" | "light";
type ViewType = "home" | "roadmap" | "notes";

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
}

const STORAGE_KEY = "eyla-project";
const THEME_KEY = "eyla-theme";
const PROJECT_NAME_KEY = "eyla-project-name";
const NOTES_KEY = "eyla-notes";

function generateLocalRoadmap(): Phase[] {
  return [
    {
      id: uid(),
      name: "Planning",
      steps: [
        { id: uid(), text: "Define the problem", completed: false },
        { id: uid(), text: "Clarify the core idea", completed: false },
      ],
    },
    {
      id: uid(),
      name: "Design",
      steps: [
        { id: uid(), text: "Sketch main user flow", completed: false },
        { id: uid(), text: "Decide MVP scope", completed: false },
      ],
    },
    {
      id: uid(),
      name: "Development",
      steps: [
        { id: uid(), text: "Implement core logic", completed: false },
        { id: uid(), text: "Test interactions", completed: false },
      ],
    },
  ];
}

export default function Page() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [idea, setIdea] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>("home");

  // Load from localStorage
  useEffect(() => {
    const rawTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (rawTheme) setTheme(rawTheme);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setIdea(parsed.idea ?? "");
      setPhases(parsed.phases ?? []);
      // If we have phases, start on roadmap view
      if (parsed.phases && parsed.phases.length > 0) {
        setCurrentView("roadmap");
      }
    }

    const savedName = localStorage.getItem(PROJECT_NAME_KEY);
    if (savedName) setProjectName(savedName);

    const savedNotes = localStorage.getItem(NOTES_KEY);
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  // Persist roadmap
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ idea, phases }));
  }, [idea, phases]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Persist project name
  useEffect(() => {
    localStorage.setItem(PROJECT_NAME_KEY, projectName);
  }, [projectName]);

  // Persist notes
  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  const ui = useMemo(
    () => ({
      page:
        "min-h-screen bg-[radial-gradient(1400px_800px_at_50%_0%,rgba(56,189,248,0.16),transparent_62%),linear-gradient(to_bottom,#050b18,#060b16)] text-slate-100",
      canvas: "ml-[280px] min-h-screen flex justify-center",
      stage: "w-full max-w-[1280px] px-10 md:px-14 py-16",
      subtitle: "text-slate-300/70",
      input:
        "w-full p-5 text-lg bg-transparent border border-slate-700/80 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600",
      primary:
        "mt-5 w-full py-4 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white",
    }),
    []
  );

  const hasRoadmap = phases.length > 0;

  function start() {
    if (!idea.trim()) return;
    setPhases(generateLocalRoadmap());
    // Auto-set project name from idea
    if (!projectName) {
      setProjectName(idea.trim());
    }
    // Navigate to roadmap view
    setCurrentView("roadmap");
  }

  function reset() {
    setIdea("");
    setPhases([]);
    setProjectName("");
    setNotes([]);
    setCurrentView("home");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROJECT_NAME_KEY);
    localStorage.removeItem(NOTES_KEY);
  }

  function addNote(text: string) {
    const newNote: Note = {
      id: uid(),
      text,
      createdAt: Date.now(),
    };
    setNotes((prev) => [...prev, newNote]);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleNavigate(view: ViewType) {
    setCurrentView(view);
  }

  // Determine what to render in the canvas
  function renderView() {
    // Notes view
    if (currentView === "notes") {
      return (
        <NotesView
          notes={notes}
          onAddNote={addNote}
          onDeleteNote={deleteNote}
          theme={theme}
        />
      );
    }

    // Roadmap view (when project exists and selected)
    if (currentView === "roadmap" && hasRoadmap) {
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

          <Roadmap phases={phases} setPhases={setPhases} theme={theme} />
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
            onKeyDown={(e) => e.key === "Enter" && start()}
            placeholder="Describe your project or idea..."
            className={ui.input}
          />
          <button onClick={start} className={ui.primary}>
            Start planning
          </button>
        </div>
      </>
    );
  }

  return (
    <main className={ui.page}>
      {/* SIDEBAR */}
      <Sidebar
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        projectName={projectName}
        phases={phases}
        notes={notes}
        hasRoadmap={hasRoadmap}
        currentView={currentView}
        onNavigate={handleNavigate}
        onReset={reset}
      />

      {/* CANVAS */}
      <div className={ui.canvas}>
        <section className={ui.stage}>
          {renderView()}
        </section>
      </div>
    </main>
  );
}
