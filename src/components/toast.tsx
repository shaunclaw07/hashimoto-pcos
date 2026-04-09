"use client";

import { X, Undo2, CheckCircle, AlertCircle, Info } from "lucide-react";
import type { ToastState } from "@/hooks/use-toast";

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
  onAction?: () => void;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
};

const typeStyles = {
  info: "bg-background border-border",
  success: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  error: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
};

const typeTextStyles = {
  info: "text-foreground",
  success: "text-green-800 dark:text-green-300",
  warning: "text-amber-800 dark:text-amber-300",
  error: "text-red-800 dark:text-red-300",
};

/**
 * Toast notification component with optional undo action
 * Displays at the bottom of the screen with slide-in animation
 */
export function Toast({ toast, onDismiss, onAction }: ToastProps) {
  if (!toast) return null;

  const Icon = typeIcons[toast.type ?? "info"];
  const hasAction = !!toast.onAction && !!toast.actionLabel;

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 transition-all duration-300 transform ${
        toast.isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 shadow-card ${typeStyles[toast.type ?? "info"]}`}
      >
        <Icon className={`h-5 w-5 shrink-0 ${typeTextStyles[toast.type ?? "info"]}`} />

        <p className={`flex-1 text-sm font-medium ${typeTextStyles[toast.type ?? "info"]}`}>
          {toast.message}
        </p>

        {hasAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-600 transition-colors shrink-0"
          >
            <Undo2 className="h-4 w-4" />
            {toast.actionLabel}
          </button>
        )}

        <button
          onClick={onDismiss}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
