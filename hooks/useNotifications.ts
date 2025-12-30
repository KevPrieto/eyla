"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Thought, Project } from "@/types";

interface UseNotificationsOptions {
  thoughts: Thought[];
  projects: Project[];
  onDismissReminder: (thoughtId: string) => void;
}

/**
 * Hook to handle browser notifications for scheduled thoughts.
 * Uses calm, non-urgent language per PRD requirements.
 */
export function useNotifications({
  thoughts,
  projects,
  onDismissReminder,
}: UseNotificationsOptions) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  // Get project name by ID
  const getProjectName = useCallback(
    (projectId?: string): string | null => {
      if (!projectId) return null;
      const project = projects.find((p) => p.id === projectId);
      return project?.name || null;
    },
    [projects]
  );

  // Show notification for a thought
  const showNotification = useCallback(
    (thought: Thought) => {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      // Calm language per PRD: "You wanted to revisit this."
      const title = "You wanted to revisit this.";
      const projectName = getProjectName(thought.projectId);
      const body = projectName
        ? `${thought.text}\n(${projectName})`
        : thought.text;

      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: thought.id, // Prevents duplicate notifications
        requireInteraction: false, // Doesn't force user to interact
      });

      // Mark as dismissed when clicked
      notification.onclick = () => {
        onDismissReminder(thought.id);
        notification.close();
      };

      // Auto-close after 10 seconds (non-intrusive)
      setTimeout(() => {
        notification.close();
      }, 10000);
    },
    [getProjectName, onDismissReminder]
  );

  // Check for due notifications
  const checkNotifications = useCallback(() => {
    const now = Date.now();

    thoughts.forEach((thought) => {
      // Skip if no schedule, already dismissed, or already notified
      if (
        !thought.scheduledAt ||
        thought.reminderDismissed ||
        notifiedRef.current.has(thought.id)
      ) {
        return;
      }

      // Check if it's time (within a 1-minute window)
      const timeDiff = now - thought.scheduledAt;
      if (timeDiff >= 0 && timeDiff < 60000) {
        notifiedRef.current.add(thought.id);
        showNotification(thought);
      }
    });
  }, [thoughts, showNotification]);

  // Start checking interval on mount
  useEffect(() => {
    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkNotifications, 30000);

    // Also check immediately on mount
    checkNotifications();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkNotifications]);

  // Clean up notified set when thoughts change (e.g., thought deleted)
  useEffect(() => {
    const currentIds = new Set(thoughts.map((t) => t.id));
    notifiedRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        notifiedRef.current.delete(id);
      }
    });
  }, [thoughts]);

  return {
    requestPermission,
    checkNotifications,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    permission:
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "denied",
  };
}
