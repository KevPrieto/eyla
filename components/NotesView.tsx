"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ThemeMode = "dark" | "light";

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

interface NotesViewProps {
  notes: Note[];
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
  theme?: ThemeMode;
}

const noteVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export default function NotesView({
  notes,
  onAddNote,
  onDeleteNote,
  theme = "dark",
}: NotesViewProps) {
  const [newNote, setNewNote] = useState("");

  const ui = {
    title: theme === "dark" ? "text-slate-100" : "text-slate-900",
    sub: theme === "dark" ? "text-slate-400" : "text-slate-600",
    input: theme === "dark"
      ? "w-full p-4 text-base bg-transparent border border-slate-700/80 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600 text-slate-100"
      : "w-full p-4 text-base bg-transparent border border-slate-200 rounded-xl outline-none placeholder:text-slate-400 focus:border-slate-400 text-slate-900",
    noteCard: theme === "dark"
      ? "p-4 rounded-xl border border-slate-800/70 bg-[#0b1220]/55 hover:border-slate-700/90 transition group"
      : "p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition group",
    noteText: theme === "dark" ? "text-slate-200" : "text-slate-800",
    noteTime: theme === "dark" ? "text-slate-500" : "text-slate-400",
    deleteBtn: theme === "dark"
      ? "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition"
      : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition",
    emptyState: theme === "dark" ? "text-slate-500" : "text-slate-400",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote("");
    }
  }

  function formatTime(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  // Sort notes newest first
  const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl font-semibold ${ui.title}`}>Notes</h1>
        <p className={`mt-1 ${ui.sub}`}>
          Capture thoughts as they come. No organization needed.
        </p>
      </div>

      {/* Quick capture */}
      <form onSubmit={handleSubmit} className="mb-8">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a thought and press Enter..."
          className={ui.input}
          autoFocus
        />
      </form>

      {/* Notes list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedNotes.length > 0 ? (
            sortedNotes.map((note) => (
              <motion.div
                key={note.id}
                className={ui.noteCard}
                variants={noteVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`flex-1 ${ui.noteText}`}>{note.text}</p>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className={ui.deleteBtn}
                    title="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className={`mt-2 text-xs ${ui.noteTime}`}>
                  {formatTime(note.createdAt)}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-12 ${ui.emptyState}`}
            >
              <p>No notes yet.</p>
              <p className="text-sm mt-1">Start typing above to capture your first thought.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
