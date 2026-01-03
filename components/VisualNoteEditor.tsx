"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeMode } from "@/types";

interface VisualNoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: string;
  onSave: (imageData: string | undefined) => void;
  theme: ThemeMode;
}

// Fixed canvas size per PRD Addendum 4.1 (no zoom, no pan)
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;

export default function VisualNoteEditor({
  isOpen,
  onClose,
  initialData,
  onSave,
  theme,
}: VisualNoteEditorProps) {
  const isDark = theme === "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const ui = {
    overlay: "fixed inset-0 z-50 flex items-center justify-center",
    backdrop: isDark
      ? "absolute inset-0 bg-black/70 backdrop-blur-sm"
      : "absolute inset-0 bg-slate-900/40 backdrop-blur-sm",
    modal: isDark
      ? "relative bg-[#0b1220] border border-slate-700 rounded-2xl p-6 shadow-2xl"
      : "relative bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl",
    canvas: isDark
      ? "rounded-xl border border-slate-700 cursor-crosshair"
      : "rounded-xl border border-slate-300 cursor-crosshair",
    header: isDark ? "text-slate-300 text-sm mb-4" : "text-slate-600 text-sm mb-4",
    footer: "flex items-center justify-between mt-4",
    clearButton: isDark
      ? "text-xs text-slate-500 hover:text-slate-300 transition"
      : "text-xs text-slate-400 hover:text-slate-600 transition",
    closeButton: isDark
      ? "text-xs text-slate-400 hover:text-slate-200 transition"
      : "text-xs text-slate-500 hover:text-slate-700 transition",
  };

  // Stroke color based on theme
  const strokeColor = isDark ? "#94a3b8" : "#475569";
  const canvasBg = isDark ? "#0f172a" : "#ffffff";

  // Initialize canvas with existing data or blank
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas background
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Load existing data if present
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasContent(true);
      };
      img.src = initialData;
    } else {
      setHasContent(false);
    }
  }, [isOpen, initialData, canvasBg]);

  // Get mouse/touch position relative to canvas
  const getPosition = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Drawing handlers
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasContent(true);

    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [getPosition, strokeColor]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPosition]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // Auto-save on stroke end (PRD: automatic persistence)
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL("image/png");
      onSave(imageData);
    }
  }, [isDrawing, onSave]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setHasContent(false);
    onSave(undefined);
  }, [canvasBg, onSave]);

  // Prevent touch scrolling when drawing
  useEffect(() => {
    if (!isOpen) return;

    const preventScroll = (e: TouchEvent) => {
      if (canvasRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [isOpen]);

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
          {/* Backdrop - click to close */}
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
          >
            {/* Header - minimal, no CTA */}
            <p className={ui.header}>Sketch a thought</p>

            {/* Canvas - fixed size, single tool */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className={ui.canvas}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* Footer */}
            <div className={ui.footer}>
              {hasContent && (
                <button onClick={handleClear} className={ui.clearButton}>
                  Clear
                </button>
              )}
              <div className="flex-1" />
              <button onClick={onClose} className={ui.closeButton}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
