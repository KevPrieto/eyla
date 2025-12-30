// Data migration from EYLA Iteration 2 to Iteration 3
import { Project, Thought, Phase, STORAGE_KEYS } from "@/types";
import { uid } from "./uid";

interface LegacyNote {
  id: string;
  text: string;
  createdAt: number;
}

interface LegacyProject {
  idea: string;
  phases: Phase[];
}

/**
 * Check if migration from Iteration 2 is needed
 */
export function needsMigration(): boolean {
  // If we already have the new format, no migration needed
  if (localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    return false;
  }

  // Check if any legacy data exists
  const hasLegacyProject = localStorage.getItem(STORAGE_KEYS.LEGACY_PROJECT);
  const hasLegacyNotes = localStorage.getItem(STORAGE_KEYS.LEGACY_NOTES);

  return !!(hasLegacyProject || hasLegacyNotes);
}

/**
 * Migrate data from Iteration 2 format to Iteration 3 format
 * This is a one-time migration that runs on first load
 */
export function migrateFromIteration2(): { projects: Project[]; thoughts: Thought[]; activeProjectId: string | null } {
  const result = {
    projects: [] as Project[],
    thoughts: [] as Thought[],
    activeProjectId: null as string | null,
  };

  // Migrate project if exists
  const rawProject = localStorage.getItem(STORAGE_KEYS.LEGACY_PROJECT);
  const rawProjectName = localStorage.getItem(STORAGE_KEYS.LEGACY_PROJECT_NAME);

  if (rawProject) {
    try {
      const legacyProject: LegacyProject = JSON.parse(rawProject);

      // Only migrate if there are actual phases
      if (legacyProject.phases && legacyProject.phases.length > 0) {
        const newProject: Project = {
          id: uid(),
          name: rawProjectName || legacyProject.idea || "Untitled project",
          idea: legacyProject.idea || "",
          status: "active",
          phases: legacyProject.phases,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        result.projects.push(newProject);
        result.activeProjectId = newProject.id;
      }
    } catch (e) {
      console.warn("Failed to migrate legacy project:", e);
    }
  }

  // Migrate notes to thoughts
  const rawNotes = localStorage.getItem(STORAGE_KEYS.LEGACY_NOTES);

  if (rawNotes) {
    try {
      const legacyNotes: LegacyNote[] = JSON.parse(rawNotes);

      result.thoughts = legacyNotes.map((note) => ({
        id: note.id,
        text: note.text,
        createdAt: note.createdAt,
        // No projectId - thoughts start unlinked (user chose shared pool)
        // No scheduledAt - legacy notes weren't scheduled
      }));
    } catch (e) {
      console.warn("Failed to migrate legacy notes:", e);
    }
  }

  // Save migrated data to new keys
  if (result.projects.length > 0) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(result.projects));
  }

  if (result.activeProjectId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, result.activeProjectId);
  }

  if (result.thoughts.length > 0) {
    localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(result.thoughts));
  }

  // Clean up legacy keys
  localStorage.removeItem(STORAGE_KEYS.LEGACY_PROJECT);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_PROJECT_NAME);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_NOTES);

  return result;
}

/**
 * Load data from localStorage (new format)
 */
export function loadFromStorage(): {
  projects: Project[];
  thoughts: Thought[];
  activeProjectId: string | null;
  theme: "dark" | "light";
} {
  let projects: Project[] = [];
  let thoughts: Thought[] = [];
  let activeProjectId: string | null = null;
  let theme: "dark" | "light" = "dark";

  // Load theme
  const rawTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (rawTheme === "light" || rawTheme === "dark") {
    theme = rawTheme;
  }

  // Check if migration is needed
  if (needsMigration()) {
    const migrated = migrateFromIteration2();
    return { ...migrated, theme };
  }

  // Load projects
  const rawProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (rawProjects) {
    try {
      projects = JSON.parse(rawProjects);
    } catch (e) {
      console.warn("Failed to parse projects:", e);
    }
  }

  // Load active project ID
  const rawActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  if (rawActiveId) {
    activeProjectId = rawActiveId;
  }

  // Load thoughts
  const rawThoughts = localStorage.getItem(STORAGE_KEYS.THOUGHTS);
  if (rawThoughts) {
    try {
      thoughts = JSON.parse(rawThoughts);
    } catch (e) {
      console.warn("Failed to parse thoughts:", e);
    }
  }

  return { projects, thoughts, activeProjectId, theme };
}
