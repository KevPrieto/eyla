// Thought CRUD operations and scheduling hook
import { useCallback } from "react";
import type { Thought } from "@/types";
import { STORAGE_KEYS } from "@/types";
import { uid } from "@/utils/uid";

type SetThoughts = React.Dispatch<React.SetStateAction<Thought[]>>;

export function useThoughtActions(
  thoughts: Thought[],
  setThoughts: SetThoughts
) {
  // Save thoughts to localStorage
  const persistThoughts = useCallback((newThoughts: Thought[]) => {
    localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(newThoughts));
  }, []);

  // Add a new thought
  const addThought = useCallback((
    text: string,
    projectId?: string,
    scheduledAt?: number
  ) => {
    const newThought: Thought = {
      id: uid(),
      text,
      createdAt: Date.now(),
      projectId,
      scheduledAt,
    };

    setThoughts((prev) => {
      const updated = [...prev, newThought];
      persistThoughts(updated);
      return updated;
    });

    return newThought;
  }, [setThoughts, persistThoughts]);

  // Update a thought
  const updateThought = useCallback((id: string, updates: Partial<Thought>) => {
    setThoughts((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      persistThoughts(updated);
      return updated;
    });
  }, [setThoughts, persistThoughts]);

  // Delete a thought
  const deleteThought = useCallback((id: string) => {
    setThoughts((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      persistThoughts(updated);
      return updated;
    });
  }, [setThoughts, persistThoughts]);

  // Link a thought to a project
  const linkToProject = useCallback((thoughtId: string, projectId: string | undefined) => {
    updateThought(thoughtId, { projectId });
  }, [updateThought]);

  // Schedule a thought
  const scheduleThought = useCallback((thoughtId: string, timestamp: number) => {
    updateThought(thoughtId, { scheduledAt: timestamp, reminderDismissed: false });
  }, [updateThought]);

  // Unschedule a thought
  const unscheduleThought = useCallback((thoughtId: string) => {
    updateThought(thoughtId, { scheduledAt: undefined, reminderDismissed: undefined });
  }, [updateThought]);

  // Dismiss a reminder
  const dismissReminder = useCallback((thoughtId: string) => {
    updateThought(thoughtId, { reminderDismissed: true });
  }, [updateThought]);

  // Get thoughts for a specific project
  const getThoughtsForProject = useCallback((projectId: string): Thought[] => {
    return thoughts.filter((t) => t.projectId === projectId);
  }, [thoughts]);

  // Get unlinked thoughts (no project)
  const getUnlinkedThoughts = useCallback((): Thought[] => {
    return thoughts.filter((t) => !t.projectId);
  }, [thoughts]);

  // Get scheduled thoughts
  const getScheduledThoughts = useCallback((): Thought[] => {
    return thoughts
      .filter((t) => t.scheduledAt !== undefined)
      .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
  }, [thoughts]);

  // Get thoughts with pending reminders (scheduled, not dismissed, time has passed)
  const getPendingReminders = useCallback((): Thought[] => {
    const now = Date.now();
    return thoughts.filter(
      (t) =>
        t.scheduledAt !== undefined &&
        t.scheduledAt <= now &&
        !t.reminderDismissed
    );
  }, [thoughts]);

  return {
    addThought,
    updateThought,
    deleteThought,
    linkToProject,
    scheduleThought,
    unscheduleThought,
    dismissReminder,
    getThoughtsForProject,
    getUnlinkedThoughts,
    getScheduledThoughts,
    getPendingReminders,
  };
}
