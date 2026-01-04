"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeMode } from "@/types";

interface ThoughtEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  initialContent: string;
  onSave: (title: string, content: string) => void;
  theme: ThemeMode;
}

export default function ThoughtEditorModal({
  isOpen,
  onClose,
  initialTitle,
  initialContent,
  onSave,
  theme,
}: ThoughtEditorModalProps) {
  const isDark = theme === "dark";
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  // Reset when opened with new data
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent);
    }
  }, [isOpen, initialTitle, initialContent]);

  const ui = {
    overlay: "fixed inset-0 z-50 flex items-center justify-center",
    backdrop: isDark
      ? "absolute inset-0 bg-black/70 backdrop-blur-sm"
      : "absolute inset-0 bg-slate-900/40 backdrop-blur-sm",
    modal: isDark
      ? "relative bg-[#0b1220] border border-slate-700 rounded-2xl p-6 shadow-2xl w-full max-w-2xl mx-4"
      : "relative bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl w-full max-w-2xl mx-4",
    header: isDark ? "text-slate-300 text-lg font-medium mb-4" : "text-slate-700 text-lg font-medium mb-4",
    input: isDark
      ? "w-full p-3 text-base bg-slate-900/50 border border-slate-700 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600 text-slate-100"
      : "w-full p-3 text-base bg-white/70 border border-slate-300 rounded-xl outline-none placeholder:text-slate-400 focus:border-sky-300 text-slate-700",
    textarea: isDark
      ? "w-full p-3 text-base bg-slate-900/50 border border-slate-700 rounded-xl outline-none placeholder:text-slate-500 focus:border-slate-600 text-slate-100 resize-none"
      : "w-full p-3 text-base bg-white/70 border border-slate-300 rounded-xl outline-none placeholder:text-slate-400 focus:border-sky-300 text-slate-700 resize-none",
    footer: "flex items-center justify-end gap-3 mt-6",
    saveButton: isDark
      ? "px-5 py-2.5 text-sm rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition"
      : "px-5 py-2.5 text-sm rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition",
    cancelButton: isDark
      ? "px-5 py-2.5 text-sm rounded-xl text-slate-400 hover:text-slate-200 transition"
      : "px-5 py-2.5 text-sm rounded-xl text-slate-500 hover:text-slate-700 transition",
  };

  function handleSave() {
    onSave(title.trim(), content.trim());
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSave();
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
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className={ui.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={ui.modal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={ui.header}>Edit thought</h3>

            {/* Title input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Title..."
              className={ui.input}
              autoFocus
            />

            {/* Content textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your thoughts here..."
              className={`${ui.textarea} mt-3`}
              rows={12}
            />

            {/* Footer */}
            <div className={ui.footer}>
              <button onClick={onClose} className={ui.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSave} className={ui.saveButton}>
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
