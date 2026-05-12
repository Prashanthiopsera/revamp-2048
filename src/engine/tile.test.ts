import { describe, it, expect } from "vitest";
import {
  createTile,
  savePosition,
  moveTile,
  mergeTiles,
  serializeTile,
  deserializeTile,
  withinBounds,
} from "./tile.js";

describe("engine/tile.ts (WO-013)", () => {
  describe("createTile()", () => {
    it("creates a tile with the given position and value", () => {
      const t = createTile({ x: 1, y: 2 }, 4);
      expect(t.x).toBe(1);
      expect(t.y).toBe(2);
      expect(t.value).toBe(4);
    });

    it("initializes previousPosition to null", () => {
      expect(createTile({ x: 0, y: 0 }, 2).previousPosition).toBeNull();
    });

    it("initializes mergedFrom to null", () => {
      expect(createTile({ x: 0, y: 0 }, 2).mergedFrom).toBeNull();
    });
  });

  describe("savePosition()", () => {
    it("sets previousPosition to the current position", () => {
      const t = createTile({ x: 2, y: 3 }, 8);
      const saved = savePosition(t);
      expect(saved.previousPosition).toEqual({ x: 2, y: 3 });
    });

    it("does not mutate the original tile", () => {
      const t = createTile({ x: 0, y: 0 }, 2);
      savePosition(t);
      expect(t.previousPosition).toBeNull();
    });

    it("preserves other fields", () => {
      const t = createTile({ x: 1, y: 1 }, 16);
      const saved = savePosition(t);
      expect(saved.value).toBe(16);
      expect(saved.x).toBe(1);
      expect(saved.y).toBe(1);
    });
  });

  describe("moveTile()", () => {
    it("returns a tile at the new position", () => {
      const t = createTile({ x: 0, y: 0 }, 2);
      const moved = moveTile(t, { x: 3, y: 2 });
      expect(moved.x).toBe(3);
      expect(moved.y).toBe(2);
    });

    it("preserves value", () => {
      const t = createTile({ x: 0, y: 0 }, 32);
      expect(moveTile(t, { x: 1, y: 1 }).value).toBe(32);
    });

    it("does not mutate the original tile", () => {
      const t = createTile({ x: 0, y: 0 }, 4);
      moveTile(t, { x: 3, y: 3 });
      expect(t.x).toBe(0);
      expect(t.y).toBe(0);
    });
  });

  describe("mergeTiles()", () => {
    it("produces a tile with value = a.value + b.value", () => {
      const a = createTile({ x: 0, y: 0 }, 4);
      const b = createTile({ x: 1, y: 0 }, 4);
      const merged = mergeTiles(a, b, { x: 0, y: 0 });
      expect(merged.value).toBe(8);
    });

    it("sets mergedFrom to [a, b]", () => {
      const a = createTile({ x: 0, y: 0 }, 8);
      const b = createTile({ x: 0, y: 1 }, 8);
      const merged = mergeTiles(a, b, { x: 0, y: 0 });
      expect(merged.mergedFrom).toEqual([a, b]);
    });

    it("places the merged tile at the given position", () => {
      const a = createTile({ x: 0, y: 0 }, 2);
      const b = createTile({ x: 1, y: 0 }, 2);
      const merged = mergeTiles(a, b, { x: 0, y: 0 });
      expect(merged.x).toBe(0);
      expect(merged.y).toBe(0);
    });

    it("previousPosition of merged tile is null", () => {
      const a = createTile({ x: 0, y: 0 }, 2);
      const b = createTile({ x: 1, y: 0 }, 2);
      expect(mergeTiles(a, b, { x: 0, y: 0 }).previousPosition).toBeNull();
    });
  });

  describe("serializeTile() / deserializeTile()", () => {
    it("round-trips a tile", () => {
      const t = createTile({ x: 2, y: 1 }, 512);
      const restored = deserializeTile(serializeTile(t));
      expect(restored.x).toBe(2);
      expect(restored.y).toBe(1);
      expect(restored.value).toBe(512);
    });

    it("serialized form is a plain object with x, y, value only", () => {
      const t = createTile({ x: 0, y: 3 }, 1024);
      const data = serializeTile(t);
      expect(Object.keys(data).sort()).toEqual(["value", "x", "y"].sort());
    });
  });

  describe("withinBounds()", () => {
    it("returns true for a tile inside the 4×4 grid", () => {
      expect(withinBounds(createTile({ x: 0, y: 0 }, 2))).toBe(true);
      expect(withinBounds(createTile({ x: 3, y: 3 }, 2))).toBe(true);
    });

    it("returns false for negative coordinates", () => {
      expect(withinBounds(createTile({ x: -1, y: 0 }, 2))).toBe(false);
    });

    it("returns false for coordinates ≥ GRID_SIZE", () => {
      expect(withinBounds(createTile({ x: 4, y: 0 }, 2))).toBe(false);
    });

    it("respects a custom size parameter", () => {
      expect(withinBounds(createTile({ x: 5, y: 5 }, 2), 6)).toBe(true);
      expect(withinBounds(createTile({ x: 6, y: 0 }, 2), 6)).toBe(false);
    });
  });
});
