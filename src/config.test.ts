import { describe, it, expect } from "vitest";
import {
  DEFAULT_RENDER_MODE,
  GRID_SIZE,
  WIN_VALUE,
  SPAWN_PROBABILITY_OF_TWO,
  STARTING_TILE_COUNT,
  ANIMATION_DURATION_SLIDE,
  ANIMATION_DURATION_APPEAR,
  ANIMATION_DURATION_POP,
  FPS_QUALITY_REDUCTION_THRESHOLD,
  FPS_FALLBACK_THRESHOLD,
  FPS_QUALITY_WINDOW_SECONDS,
  FPS_FALLBACK_WINDOW_SECONDS,
} from "./config.js";
import type { RenderMode } from "./config.js";

describe("config.ts (WO-008)", () => {
  describe("RenderMode type", () => {
    it("DEFAULT_RENDER_MODE is '2d'", () => {
      expect(DEFAULT_RENDER_MODE).toBe("2d");
    });

    it("DEFAULT_RENDER_MODE satisfies the RenderMode type", () => {
      // Type-level check: assigning to a typed variable will fail tsc if wrong
      const mode: RenderMode = DEFAULT_RENDER_MODE;
      expect(mode).toBeDefined();
    });
  });

  describe("Grid constants", () => {
    it("GRID_SIZE is 4", () => {
      expect(GRID_SIZE).toBe(4);
    });

    it("GRID_SIZE is within valid range (2–8)", () => {
      expect(GRID_SIZE).toBeGreaterThanOrEqual(2);
      expect(GRID_SIZE).toBeLessThanOrEqual(8);
    });
  });

  describe("Gameplay constants", () => {
    it("WIN_VALUE is 2048", () => {
      expect(WIN_VALUE).toBe(2048);
    });

    it("WIN_VALUE is a power of 2", () => {
      expect(Math.log2(WIN_VALUE) % 1).toBe(0);
    });

    it("SPAWN_PROBABILITY_OF_TWO is 0.9", () => {
      expect(SPAWN_PROBABILITY_OF_TWO).toBe(0.9);
    });

    it("SPAWN_PROBABILITY_OF_TWO is within valid range (0–1)", () => {
      expect(SPAWN_PROBABILITY_OF_TWO).toBeGreaterThanOrEqual(0);
      expect(SPAWN_PROBABILITY_OF_TWO).toBeLessThanOrEqual(1);
    });

    it("STARTING_TILE_COUNT is 2", () => {
      expect(STARTING_TILE_COUNT).toBe(2);
    });

    it("STARTING_TILE_COUNT fits in the grid", () => {
      expect(STARTING_TILE_COUNT).toBeGreaterThanOrEqual(1);
      expect(STARTING_TILE_COUNT).toBeLessThan(GRID_SIZE * GRID_SIZE);
    });
  });

  describe("Animation durations", () => {
    it("ANIMATION_DURATION_SLIDE is 100ms", () => {
      expect(ANIMATION_DURATION_SLIDE).toBe(100);
    });

    it("ANIMATION_DURATION_APPEAR is 200ms", () => {
      expect(ANIMATION_DURATION_APPEAR).toBe(200);
    });

    it("ANIMATION_DURATION_POP is 200ms", () => {
      expect(ANIMATION_DURATION_POP).toBe(200);
    });

    it("all durations are positive numbers", () => {
      expect(ANIMATION_DURATION_SLIDE).toBeGreaterThan(0);
      expect(ANIMATION_DURATION_APPEAR).toBeGreaterThan(0);
      expect(ANIMATION_DURATION_POP).toBeGreaterThan(0);
    });
  });

  describe("Performance thresholds", () => {
    it("FPS_QUALITY_REDUCTION_THRESHOLD is 55", () => {
      expect(FPS_QUALITY_REDUCTION_THRESHOLD).toBe(55);
    });

    it("FPS_FALLBACK_THRESHOLD is 45", () => {
      expect(FPS_FALLBACK_THRESHOLD).toBe(45);
    });

    it("FPS_QUALITY_WINDOW_SECONDS is 3", () => {
      expect(FPS_QUALITY_WINDOW_SECONDS).toBe(3);
    });

    it("FPS_FALLBACK_WINDOW_SECONDS is 5", () => {
      expect(FPS_FALLBACK_WINDOW_SECONDS).toBe(5);
    });

    it("quality reduction triggers before fallback (higher FPS threshold)", () => {
      expect(FPS_QUALITY_REDUCTION_THRESHOLD).toBeGreaterThan(FPS_FALLBACK_THRESHOLD);
    });

    it("quality window is shorter than fallback window", () => {
      expect(FPS_QUALITY_WINDOW_SECONDS).toBeLessThan(FPS_FALLBACK_WINDOW_SECONDS);
    });
  });
});
