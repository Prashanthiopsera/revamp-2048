/**
 * usePerformanceMonitor — tracks frame rate using requestAnimationFrame timing
 * and triggers callbacks when FPS drops below configured thresholds.
 *
 * ## Two-tier degradation model (REQ-020)
 * Tier 1 — Quality reduction: triggered when rolling-average FPS stays below
 *   FPS_QUALITY_REDUCTION_THRESHOLD for FPS_QUALITY_WINDOW_SECONDS.
 * Tier 2 — 2D fallback:      triggered when rolling-average FPS stays below
 *   FPS_FALLBACK_THRESHOLD for FPS_FALLBACK_WINDOW_SECONDS.
 *
 * Both timers reset when FPS recovers above the respective threshold.
 *
 * ## Design notes
 * - Uses `requestAnimationFrame` for timing; the loop is inactive when
 *   `enabled` is false. `fps` is synthesized as 0 during render when disabled
 *   — no setState-in-effect is needed.
 * - Callback props are included in the effect deps array (not synced via a
 *   ref during render, which violates react-hooks/refs). Callers should wrap
 *   callbacks in useCallback to avoid unnecessary re-registrations.
 * - Maintains a circular rolling-window buffer for the frame-time average
 *   (default 60 frames — configurable via `windowSize`).
 * - Returns `fps` for display/debug overlays; callbacks fire at most once
 *   per continuous below-threshold period.
 * - Cleans up the rAF handle on unmount.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  FPS_QUALITY_REDUCTION_THRESHOLD,
  FPS_FALLBACK_THRESHOLD,
  FPS_QUALITY_WINDOW_SECONDS,
  FPS_FALLBACK_WINDOW_SECONDS,
} from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for `usePerformanceMonitor`.
 * All fields are optional; defaults are sourced from `src/config.ts`.
 */
export interface UsePerformanceMonitorOptions {
  /** Only active when true — set to false when not in 3D mode. Default: true. */
  readonly enabled?: boolean;
  /** Number of frames in the rolling average. Default: 60. */
  readonly windowSize?: number;
  /** FPS below which quality-reduction is triggered. Default: from config. */
  readonly qualityThreshold?: number;
  /** Seconds FPS must stay below qualityThreshold. Default: from config. */
  readonly qualityWindowSeconds?: number;
  /** FPS below which 2D fallback is triggered. Default: from config. */
  readonly fallbackThreshold?: number;
  /** Seconds FPS must stay below fallbackThreshold. Default: from config. */
  readonly fallbackWindowSeconds?: number;
  /** Called (once) when rolling-average FPS drops below qualityThreshold for qualityWindowSeconds. */
  readonly onQualityReduction?: () => void;
  /** Called (once) when rolling-average FPS drops below fallbackThreshold for fallbackWindowSeconds. */
  readonly onFallback?: () => void;
}

/** Values returned by `usePerformanceMonitor`. */
export interface UsePerformanceMonitorResult {
  /** Rolling-average FPS (rounded). 0 when the hook is disabled. Use for debug overlays. */
  readonly fps: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Tracks 3D rendering frame rate using `requestAnimationFrame` timing and fires
 * callbacks when FPS drops below configured thresholds.
 *
 * @param options - Configuration overrides; all fields are optional.
 * @returns Object containing the current rolling-average `fps`.
 *
 * @example
 * const { fps } = usePerformanceMonitor({
 *   enabled: mode === "3d",
 *   onQualityReduction: () => setQualityReduced(true),
 *   onFallback: () => toggleMode(),
 * });
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {},
): UsePerformanceMonitorResult {
  const {
    enabled = true,
    windowSize = 60,
    qualityThreshold = FPS_QUALITY_REDUCTION_THRESHOLD,
    qualityWindowSeconds = FPS_QUALITY_WINDOW_SECONDS,
    fallbackThreshold = FPS_FALLBACK_THRESHOLD,
    fallbackWindowSeconds = FPS_FALLBACK_WINDOW_SECONDS,
    onQualityReduction,
    onFallback,
  } = options;

  // Internal FPS state — updated only by the rAF tick callback
  const [rawFps, setRawFps] = useState(0);

  // Synthesize fps=0 when disabled without calling setState inside an effect
  const fps = enabled ? rawFps : 0;

  // rAF handle for cleanup
  const rafRef = useRef<number>(0);

  // Per-effect flag refs (reset when the effect re-runs due to deps change)
  const qualityFiredRef = useRef(false);
  const fallbackFiredRef = useRef(false);

  const resetThresholdState = useCallback(() => {
    qualityFiredRef.current = false;
    fallbackFiredRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(rafRef.current);
      resetThresholdState();
      return;
    }

    // Rolling window — circular buffer of frame-time deltas (ms)
    const frameTimes = new Float64Array(windowSize);
    let bufferHead = 0;
    let bufferFilled = 0;

    // Time-below-threshold accumulators (seconds)
    let qualityBelowSec = 0;
    let fallbackBelowSec = 0;

    let lastTimestamp: number | null = null;

    function tick(timestamp: number): void {
      if (lastTimestamp !== null) {
        const deltaMs = timestamp - lastTimestamp;
        const deltaSec = deltaMs / 1000;

        // Update rolling window
        frameTimes[bufferHead] = deltaMs;
        bufferHead = (bufferHead + 1) % windowSize;
        if (bufferFilled < windowSize) bufferFilled++;

        // Compute average FPS from the window
        let totalMs = 0;
        for (let i = 0; i < bufferFilled; i++) {
          totalMs += frameTimes[i];
        }
        const avgFps = bufferFilled > 0 ? Math.round(1000 / (totalMs / bufferFilled)) : 0;

        // Update displayed FPS via setState — this is in a rAF subscription callback,
        // not synchronously in the effect body, so it does not violate the lint rule.
        setRawFps(avgFps);

        // Tier 1: quality reduction
        if (avgFps < qualityThreshold) {
          qualityBelowSec += deltaSec;
          if (qualityBelowSec >= qualityWindowSeconds && !qualityFiredRef.current) {
            qualityFiredRef.current = true;
            onQualityReduction?.();
          }
        } else {
          qualityBelowSec = 0;
          qualityFiredRef.current = false;
        }

        // Tier 2: fallback to 2D
        if (avgFps < fallbackThreshold) {
          fallbackBelowSec += deltaSec;
          if (fallbackBelowSec >= fallbackWindowSeconds && !fallbackFiredRef.current) {
            fallbackFiredRef.current = true;
            onFallback?.();
          }
        } else {
          fallbackBelowSec = 0;
          fallbackFiredRef.current = false;
        }
      }

      lastTimestamp = timestamp;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resetThresholdState();
    };
  }, [
    enabled,
    windowSize,
    qualityThreshold,
    qualityWindowSeconds,
    fallbackThreshold,
    fallbackWindowSeconds,
    onQualityReduction,
    onFallback,
    resetThresholdState,
  ]);

  return { fps };
}
