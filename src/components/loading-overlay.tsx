"use client";

import { Loader2, Barcode } from "lucide-react";

interface LoadingOverlayProps {
  /** The barcode being processed */
  barcode?: string;
  /** Custom message to display */
  message?: string;
  /** Whether the overlay is visible */
  isVisible: boolean;
}

/**
 * Full-screen loading overlay that blocks interactions
 * Used during barcode scanning to prevent multiple rapid scans
 */
export function LoadingOverlay({
  barcode,
  message = "Produkt wird geladen...",
  isVisible,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Produkt wird geladen"
    >
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Loading spinner */}
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">{message}</p>

          {/* Barcode display */}
          {barcode && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2">
              <Barcode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground tracking-wider">
                {barcode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
