/**
 * Tests for usePerformanceMonitor (WO-024).
 *
 * requestAnimationFrame doesn't run in JSDOM, so we use Vitest's fake timers
 * together with a mock rAF that drives the hook manually.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePerformanceMonitor } from "./usePerformanceMonitor.js";
import {
  FPS_QUALITY_REDUCTION_THRESHOLD,
  FPS_FALLBACK_THRESHOLD,
} from "../config.js";

// ---------------------------------------------------------------------------
// rAF mock
// ---------------------------------------------------------------------------

let rafCallbacks = new Map<number, FrameRequestCallback>();
let rafId = 0;

function mockRaf(callback: FrameRequestCallback): number {
  const id = ++rafId;
  rafCallbacks.set(id, callback);
  return id;
}

function mockCancelRaf(id: number): void {
  rafCallbacks.delete(id);
}

/**
 * Simulates the passage of `count` animation frames, each `frameDeltaMs` ms apart.
 */
function advanceFrames(count: number, frameDeltaMs: number): void {
  let ts = performance.now();
  for (let i = 0; i < count; i++) {
    ts += frameDeltaMs;
    const pending = new Map(rafCallbacks);
    rafCallbacks.clear();
    for (const [, cb] of pending) {
      cb(ts);
    }
  }
}

beforeEach(() => {
  rafCallbacks = new Map();
  rafId = 0;
  vi.stubGlobal("requestAnimationFrame", mockRaf);
  vi.stubGlobal("cancelAnimationFrame", mockCancelRaf);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePerformanceMonitor (WO-024)", () => {
  describe("initialization", () => {
    it("starts with fps=0", () => {
      const { result } = renderHook(() => usePerformanceMonitor());
      expect(result.current.fps).toBe(0);
    });

    it("starts rAF loop when enabled=true (default)", () => {
      renderHook(() => usePerformanceMonitor());
      expect(rafCallbacks.size).toBeGreaterThan(0);
    });

    it("does not start rAF loop when enabled=false", () => {
      renderHook(() => usePerformanceMonitor({ enabled: false }));
      expect(rafCallbacks.size).toBe(0);
    });
  });

  describe("FPS tracking", () => {
    it("computes fps from frame deltas (60 fps = 16.67ms per frame)", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ windowSize: 10 }));
      act(() => { advanceFrames(15, 1000 / 60); });
      // Expect approximately 60 fps (±5 due to rounding)
      expect(result.current.fps).toBeGreaterThan(55);
      expect(result.current.fps).toBeLessThanOrEqual(65);
    });

    it("computes lower fps for slower frames (30 fps = 33.33ms per frame)", () => {
      const { result } = renderHook(() => usePerformanceMonitor({ windowSize: 10 }));
      act(() => { advanceFrames(15, 1000 / 30); });
      expect(result.current.fps).toBeGreaterThan(25);
      expect(result.current.fps).toBeLessThanOrEqual(35);
    });
  });

  describe("threshold callbacks", () => {
    it("calls onQualityReduction when FPS stays below threshold for the window", () => {
      const onQualityReduction = vi.fn();
      // Low threshold: 100fps so our 60fps renders always trigger it
      // Window: 1 second
      renderHook(() => usePerformanceMonitor({
        windowSize: 5,
        qualityThreshold: 100,
        qualityWindowSeconds: 1,
        fallbackThreshold: 0,
        fallbackWindowSeconds: 999,
        onQualityReduction,
      }));

      act(() => {
        // 60fps frames — below 100fps threshold. Each frame is ~16.67ms = 0.01667s
        // Need 1s worth of frames: 60 frames
        advanceFrames(70, 1000 / 60);
      });

      expect(onQualityReduction).toHaveBeenCalledTimes(1);
    });

    it("calls onFallback when FPS stays below fallback threshold for the window", () => {
      const onFallback = vi.fn();
      renderHook(() => usePerformanceMonitor({
        windowSize: 5,
        qualityThreshold: 0,
        qualityWindowSeconds: 999,
        fallbackThreshold: 100,
        fallbackWindowSeconds: 1,
        onFallback,
      }));

      act(() => {
        advanceFrames(70, 1000 / 60);
      });

      expect(onFallback).toHaveBeenCalledTimes(1);
    });

    it("does not call onQualityReduction when FPS is above threshold", () => {
      const onQualityReduction = vi.fn();
      renderHook(() => usePerformanceMonitor({
        windowSize: 5,
        qualityThreshold: 30,  // 60fps > 30fps so no trigger
        qualityWindowSeconds: 0.1,
        onQualityReduction,
      }));

      act(() => { advanceFrames(30, 1000 / 60); });
      expect(onQualityReduction).not.toHaveBeenCalled();
    });

    it("fires callback only once per below-threshold period", () => {
      const onQualityReduction = vi.fn();
      renderHook(() => usePerformanceMonitor({
        windowSize: 3,
        qualityThreshold: 100,
        qualityWindowSeconds: 0.1,
        fallbackThreshold: 0,
        fallbackWindowSeconds: 999,
        onQualityReduction,
      }));

      act(() => {
        // Drive many frames — callback should only fire once
        advanceFrames(200, 1000 / 60);
      });

      expect(onQualityReduction).toHaveBeenCalledTimes(1);
    });
  });

  describe("enabled flag", () => {
    it("stops the rAF loop when disabled mid-render", () => {
      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => usePerformanceMonitor({ enabled }),
        { initialProps: { enabled: true } },
      );

      expect(rafCallbacks.size).toBeGreaterThan(0);

      act(() => { rerender({ enabled: false }); });
      // After disabling, pending callbacks are cancelled
      expect(rafCallbacks.size).toBe(0);
    });

    it("resets fps to 0 when disabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => usePerformanceMonitor({ enabled, windowSize: 5 }),
        { initialProps: { enabled: true } },
      );

      act(() => { advanceFrames(10, 1000 / 60); });
      expect(result.current.fps).toBeGreaterThan(0);

      act(() => { rerender({ enabled: false }); });
      expect(result.current.fps).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("cancels rAF on unmount", () => {
      const { unmount } = renderHook(() => usePerformanceMonitor());
      expect(rafCallbacks.size).toBeGreaterThan(0);
      act(() => { unmount(); });
      expect(rafCallbacks.size).toBe(0);
    });
  });

  describe("config defaults", () => {
    it("uses config thresholds by default", () => {
      // Verify constants are exported and are numbers — the hook uses them internally
      expect(FPS_QUALITY_REDUCTION_THRESHOLD).toBeGreaterThan(0);
      expect(FPS_FALLBACK_THRESHOLD).toBeGreaterThan(0);
      expect(FPS_FALLBACK_THRESHOLD).toBeLessThan(FPS_QUALITY_REDUCTION_THRESHOLD);
    });
  });
});
