"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Counter for generating unique toast IDs (avoids Math.random() collisions)
let toastCounter = 0;

export interface ToastOptions {
  /** Message to display */
  message: string;
  /** Action button text */
  actionLabel?: string;
  /** Callback when action is clicked */
  onAction?: () => void;
  /** Duration in ms before auto-dismiss (default: 3000) */
  duration?: number;
  /** Toast type for styling */
  type?: "info" | "success" | "warning" | "error";
}

export interface ToastState extends ToastOptions {
  id: string;
  isVisible: boolean;
}

/**
 * Hook for managing toast notifications with optional undo action
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIdRef = useRef<string>("");

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast((prev) => (prev ? { ...prev, isVisible: false } : null));

    // Remove from state after animation
    setTimeout(() => {
      setToast(null);
    }, 300);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      // Dismiss any existing toast
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const id = `${Date.now()}-${toastCounter++}`;
      currentIdRef.current = id;

      setToast({
        ...options,
        id,
        isVisible: true,
        duration: options.duration ?? 3000,
        type: options.type ?? "info",
      });

      // Auto-dismiss after duration
      const duration = options.duration ?? 3000;
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    },
    [dismiss]
  );

  const handleAction = useCallback(() => {
    if (toast?.onAction) {
      toast.onAction();
    }
    dismiss();
  }, [toast, dismiss]);

  return {
    toast,
    show,
    dismiss,
    handleAction,
  };
}
