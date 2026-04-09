"use client";

import { Loader2, RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  /** Current pull distance in pixels */
  pullDistance: number;
  /** Whether the user is currently pulling */
  isPulling: boolean;
  /** Whether refresh has been triggered */
  isRefreshing: boolean;
  /** Whether the pull has passed the threshold */
  canRelease: boolean;
  /** Threshold distance to trigger refresh */
  threshold?: number;
}

/**
 * Visual indicator for pull-to-refresh gesture
 * Shows at the top of a scrollable container
 */
export function PullToRefreshIndicator({
  pullDistance,
  isPulling,
  isRefreshing,
  canRelease,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  // Only show when pulling or refreshing
  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center overflow-hidden transition-transform duration-150"
      style={{
        height: `${pullDistance}px`,
        transform: isPulling || isRefreshing ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div className="flex flex-col items-center justify-center pb-2">
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <RefreshCw
            className={`h-6 w-6 text-primary transition-all duration-200 ${
              canRelease ? "scale-110" : "scale-100 opacity-70"
            }`}
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          />
        )}

        <span className="mt-1 text-xs font-medium text-muted-foreground">
          {isRefreshing
            ? "Wird aktualisiert..."
            : canRelease
            ? "Loslassen zum Aktualisieren"
            : "Ziehen zum Aktualisieren"}
        </span>
      </div>
    </div>
  );
}
