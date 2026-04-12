"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UsePullToRefreshOptions {
  /** Callback to trigger when pull-to-refresh is activated */
  onRefresh: () => void | Promise<void>;
  /** Minimum distance (in px) to pull before triggering refresh */
  threshold?: number;
  /** Maximum distance (in px) the indicator can be pulled */
  maxPullDistance?: number;
  /** Resistance factor for pull (0-1, default: 0.5) - higher = more resistance */
  resistance?: number;
  /** Whether pull-to-refresh is enabled */
  enabled?: boolean;
}

interface PullToRefreshState {
  /** Current pull distance in pixels */
  pullDistance: number;
  /** Whether the user is currently pulling */
  isPulling: boolean;
  /** Whether refresh has been triggered */
  isRefreshing: boolean;
  /** Whether the pull has passed the threshold */
  canRelease: boolean;
}

/**
 * Hook for implementing pull-to-refresh gesture on mobile
 * Only activates when scroll position is at the top of the container
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  resistance = 0.5,
  enabled = true,
}: UsePullToRefreshOptions): {
  state: PullToRefreshState;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  containerRef: React.RefObject<HTMLDivElement | null>;
} {
  const [state, setState] = useState<PullToRefreshState>({
    pullDistance: 0,
    isPulling: false,
    isRefreshing: false,
    canRelease: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isPullingDownRef = useRef(false);
  const isRefreshingRef = useRef(false);

  // Keep ref in sync with state to avoid stale closures
  useEffect(() => {
    isRefreshingRef.current = state.isRefreshing;
  }, [state.isRefreshing]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || state.isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // Only activate if at the top of the scroll container
      if (container.scrollTop > 0) return;

      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;

      setState((prev) => ({ ...prev, isPulling: true }));
    },
    [enabled, state.isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || !enabled) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // Only allow pulling down (positive diff)
      if (diff < 0) {
        isPullingDownRef.current = false; // user is scrolling up → release lock
        return;
      }
      isPullingDownRef.current = true; // genuinely pulling down → engage lock

      // Apply resistance to the pull
      const resistedDistance = Math.min(diff * resistance, maxPullDistance);

      setState({
        pullDistance: resistedDistance,
        isPulling: true,
        isRefreshing: isRefreshingRef.current,
        canRelease: resistedDistance >= threshold,
      });
    },
    [enabled, maxPullDistance, threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    isPullingDownRef.current = false;

    const shouldRefresh = state.pullDistance >= threshold;

    if (shouldRefresh && !state.isRefreshing) {
      setState((prev) => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: threshold * 0.8, // Stay slightly pulled down during refresh
      }));

      try {
        await onRefresh();
      } finally {
        // Reset after refresh completes
        setState({
          pullDistance: 0,
          isPulling: false,
          isRefreshing: false,
          canRelease: false,
        });
      }
    } else {
      // Spring back if threshold not reached
      setState({
        pullDistance: 0,
        isPulling: false,
        isRefreshing: false,
        canRelease: false,
      });
    }
  }, [onRefresh, state.pullDistance, threshold, state.isRefreshing]);

  // Prevent default scroll behavior during pull
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isPullingDownRef.current && container.scrollTop === 0) {
        e.preventDefault();
      }
    };

    // Note: passive: false is required to prevent default scroll during pull gesture
    // This is an intentional trade-off for the pull-to-refresh UX
    container.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  return {
    state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    containerRef,
  };
}
