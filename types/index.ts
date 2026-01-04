// EYLA v4.2 - Core Type Definitions

// Theme and View types
export type ThemeMode = "dark" | "light";
export type ViewType = "home" | "roadmap" | "thoughts" | "calendar";

// Project state enum
export type ProjectStatus = "active" | "paused" | "archived";

// Step within a phase
export interface Step {
  id: string;
  text: string;
  completed: boolean;
  x?: number;  // Canvas X position
  y?: number;  // Canvas Y position
}

// Phase containing steps
export interface Phase {
  id: string;
  name: string;
  steps: Step[];
}

// Project - first-class container with its own roadmap
export interface Project {
  id: string;
  name: string;
  idea: string;
  status: ProjectStatus;
  phases: Phase[];
  createdAt: number;
  updatedAt: number;
}

// Thought (renamed from Note) with optional project link and scheduling
export interface Thought {
  id: string;
  text: string;
  createdAt: number;
  projectId?: string;           // Optional project association
  stepId?: string;              // Optional step association (for roadmap canvas)
  scheduledAt?: number;         // Optional datetime (unix timestamp)
  reminderDismissed?: boolean;  // Track if reminder was dismissed
  visualNote?: string;          // Optional base64 image data (Addendum 4.1)
}

// For calendar grouping
export interface ScheduledThoughtGroup {
  date: string;  // ISO date string (YYYY-MM-DD)
  thoughts: Thought[];
}

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: "eyla-projects",
  ACTIVE_PROJECT_ID: "eyla-active-project-id",
  THOUGHTS: "eyla-thoughts",
  THEME: "eyla-theme",
  // Legacy keys (for migration)
  LEGACY_PROJECT: "eyla-project",
  LEGACY_PROJECT_NAME: "eyla-project-name",
  LEGACY_NOTES: "eyla-notes",
} as const;
