// Project CRUD operations hook
import { useCallback } from "react";
import type { Project, Phase, ProjectStatus } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { uid } from "@/utils/uid";

type SetProjects = React.Dispatch<React.SetStateAction<Project[]>>;
type SetActiveProjectId = React.Dispatch<React.SetStateAction<string | null>>;

// Default roadmap for new projects
function generateDefaultRoadmap(): Phase[] {
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

export function useProjectActions(
  projects: Project[],
  setProjects: SetProjects,
  activeProjectId: string | null,
  setActiveProjectId: SetActiveProjectId
) {
  // Save projects to localStorage
  const persistProjects = useCallback((newProjects: Project[]) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(newProjects));
  }, []);

  // Save active project ID
  const persistActiveId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    }
  }, []);

  // Add a new project
  const addProject = useCallback((name: string, idea: string) => {
    const newProject: Project = {
      id: uid(),
      name: name || idea || "Untitled project",
      idea,
      status: "active",
      phases: generateDefaultRoadmap(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((prev) => {
      const updated = [...prev, newProject];
      persistProjects(updated);
      return updated;
    });

    // Set as active project
    setActiveProjectId(newProject.id);
    persistActiveId(newProject.id);

    return newProject;
  }, [setProjects, setActiveProjectId, persistProjects, persistActiveId]);

  // Update a project
  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      );
      persistProjects(updated);
      return updated;
    });
  }, [setProjects, persistProjects]);

  // Update project status
  const updateProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    updateProject(id, { status });
  }, [updateProject]);

  // Update project phases (roadmap)
  const updateProjectPhases = useCallback((id: string, phases: Phase[]) => {
    updateProject(id, { phases });
  }, [updateProject]);

  // Delete a project
  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      persistProjects(updated);
      return updated;
    });

    // If deleting active project, clear active
    if (activeProjectId === id) {
      setActiveProjectId(null);
      persistActiveId(null);
    }
  }, [setProjects, activeProjectId, setActiveProjectId, persistProjects, persistActiveId]);

  // Select a project as active
  const selectProject = useCallback((id: string) => {
    setActiveProjectId(id);
    persistActiveId(id);
  }, [setActiveProjectId, persistActiveId]);

  // Get the active project
  const getActiveProject = useCallback((): Project | null => {
    return projects.find((p) => p.id === activeProjectId) ?? null;
  }, [projects, activeProjectId]);

  // Calculate progress percentage for a project
  const getProjectProgress = useCallback((project: Project): number => {
    const allSteps = project.phases.flatMap((p) => p.steps);
    if (allSteps.length === 0) return 0;
    const completed = allSteps.filter((s) => s.completed).length;
    return Math.round((completed / allSteps.length) * 100);
  }, []);

  return {
    addProject,
    updateProject,
    updateProjectStatus,
    updateProjectPhases,
    deleteProject,
    selectProject,
    getActiveProject,
    getProjectProgress,
  };
}
