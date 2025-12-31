"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeMode } from "@/types";

interface ScheduleModalProps {
  isOpen: boolean;
  thoughtText: string;
  currentSchedule?: number;
  onConfirm: (timestamp: number) => void;
  onCancel: () => void;
  theme: ThemeMode;
}

// Helper to get current datetime in local format for input
function getLocalDateTimeString(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  // Add 1 hour if no timestamp (default to 1 hour from now)
  if (!timestamp) {
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
  }
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ScheduleModal({
  isOpen,
  thoughtText,
  currentSchedule,
  onConfirm,
  onCancel,
  theme,
}: ScheduleModalProps) {
  const isDark = theme === "dark";

  const [dateTime, setDateTime] = useState(getLocalDateTimeString(currentSchedule));

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setDateTime(getLocalDateTimeString(currentSchedule));
    }
  }, [isOpen, currentSchedule]);

  const ui = {
    overlay: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
    modal: isDark
      ? "bg-[#0b1220] border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl"
      : "bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-xl shadow-violet-300/20",
    title: isDark ? "text-slate-100 text-lg font-medium" : "text-slate-900 text-lg font-medium",
    label: isDark ? "text-slate-400 text-sm" : "text-slate-600 text-sm",
    input: isDark
      ? "w-full mt-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-100 outline-none focus:border-slate-600"
      : "w-full mt-2 p-3 rounded-xl bg-white/60 border border-white/60 text-slate-700 outline-none focus:border-sky-300",
    preview: isDark ? "text-slate-500 text-xs mt-2" : "text-slate-400 text-xs mt-2",
    thoughtPreview: isDark
      ? "text-slate-300 text-sm p-3 rounded-lg bg-slate-800/50 mb-4 line-clamp-2"
      : "text-slate-600 text-sm p-3 rounded-xl bg-white/50 mb-4 line-clamp-2",
    buttonPrimary: isDark
      ? "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
      : "px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm transition",
    buttonSecondary: isDark
      ? "px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition"
      : "px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-sm transition",
  };

  function handleConfirm() {
    const timestamp = new Date(dateTime).getTime();
    if (!isNaN(timestamp)) {
      onConfirm(timestamp);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={ui.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className={ui.modal}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <h3 className={ui.title}>Schedule a reminder</h3>

            {/* Thought preview */}
            <div className={ui.thoughtPreview}>{thoughtText}</div>

            {/* Date/time picker */}
            <div>
              <label className={ui.label}>When would you like to be reminded?</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className={ui.input}
                min={getLocalDateTimeString()}
              />
              <p className={ui.preview}>
                The reminder will gently appear at this time.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={onCancel} className={ui.buttonSecondary}>
                Cancel
              </button>
              <button onClick={handleConfirm} className={ui.buttonPrimary}>
                Schedule
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
