/**
 * Engine unit tests — Tile (WO-030)
 *
 * Covers: tile creation, position save/update, serialization,
 * mergedFrom tracking, bounds checking, and immutability contract.
 */
import { describe, it, expect } from "vitest";
import {
  createTile,
  savePosition,
  moveTile,
  mergeTiles,
  serializeTile,
  deserializeTile,
  withinBounds,
} from "../../engine/tile.js";
import { GRID_SIZE } from "../../config.js";

// ---------------------------------------------------------------------------
// Tile creation
// ---------------------------------------------------------------------------

describe("createTile", () => {
  it("creates a tile with the given position and value", () => {
    const tile = createTile({ x: 1, y: 2 }, 4);
    expect(tile.x).toBe(1);
    expect(tile.y).toBe(2);
    expect(tile.value).toBe(4);
  });

  it("sets previousPosition and mergedFrom to null on creation", () => {
    const tile = createTile({ x: 0, y: 0 }, 2);
    expect(tile.previousPosition).toBeNull();
    expect(tile.mergedFrom).toBeNull();
  });

  it("supports all standard tile values", () => {
    [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].forEach((v) => {
      const t = createTile({ x: 0, y: 0 }, v);
      expect(t.value).toBe(v);
    });
  });

  it("supports super tile values > 2048", () => {
    const t = createTile({ x: 0, y: 0 }, 4096);
    expect(t.value).toBe(4096);
  });
});

// ---------------------------------------------------------------------------
// savePosition
// ---------------------------------------------------------------------------

describe("savePosition", () => {
  it("copies current position into previousPosition", () => {
    const tile = createTile({ x: 2, y: 3 }, 8);
    const saved = savePosition(tile);
    expect(saved.previousPosition).toEqual({ x: 2, y: 3 });
  });

  it("does not modify the original tile", () => {
    const tile = createTile({ x: 1, y: 1 }, 2);
    savePosition(tile);
    expect(tile.previousPosition).toBeNull();
  });

  it("preserves value through save", () => {
    const tile = createTile({ x: 0, y: 0 }, 16);
    const saved = savePosition(tile);
    expect(saved.value).toBe(16);
  });
});

// ---------------------------------------------------------------------------
// moveTile
// ---------------------------------------------------------------------------

describe("moveTile", () => {
  it("returns a new tile at the target position", () => {
    const tile = createTile({ x: 0, y: 0 }, 2);
    const moved = moveTile(tile, { x: 3, y: 3 });
    expect(moved.x).toBe(3);
    expect(moved.y).toBe(3);
  });

  it("does not modify the original tile's position", () => {
    const tile = createTile({ x: 1, y: 2 }, 4);
    moveTile(tile, { x: 3, y: 3 });
    expect(tile.x).toBe(1);
    expect(tile.y).toBe(2);
  });

  it("retains the tile value", () => {
    const tile = createTile({ x: 0, y: 0 }, 64);
    const moved = moveTile(tile, { x: 2, y: 1 });
    expect(moved.value).toBe(64);
  });
});

// ---------------------------------------------------------------------------
// mergeTiles
// ---------------------------------------------------------------------------

describe("mergeTiles", () => {
  it("creates a merged tile with doubled value", () => {
    const a = createTile({ x: 1, y: 0 }, 4);
    const b = createTile({ x: 2, y: 0 }, 4);
    const merged = mergeTiles(a, b, { x: 2, y: 0 });
    expect(merged.value).toBe(8);
  });

  it("sets mergedFrom to [a, b]", () => {
    const a = createTile({ x: 0, y: 0 }, 2);
    const b = createTile({ x: 1, y: 0 }, 2);
    const merged = mergeTiles(a, b, { x: 1, y: 0 });
    expect(merged.mergedFrom).not.toBeNull();
    expect(merged.mergedFrom?.[0].value).toBe(2);
    expect(merged.mergedFrom?.[1].value).toBe(2);
  });

  it("places merged tile at the target position", () => {
    const a = createTile({ x: 0, y: 2 }, 8);
    const b = createTile({ x: 0, y: 3 }, 8);
    const merged = mergeTiles(a, b, { x: 0, y: 3 });
    expect(merged.x).toBe(0);
    expect(merged.y).toBe(3);
  });

  it("merged tile has null previousPosition", () => {
    const a = createTile({ x: 0, y: 0 }, 16);
    const b = createTile({ x: 1, y: 0 }, 16);
    const merged = mergeTiles(a, b, { x: 1, y: 0 });
    expect(merged.previousPosition).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

describe("serializeTile / deserializeTile", () => {
  it("round-trips a simple tile without mergedFrom", () => {
    const tile = createTile({ x: 2, y: 3 }, 16);
    const data = serializeTile(tile);
    const restored = deserializeTile(data);
    expect(restored.x).toBe(2);
    expect(restored.y).toBe(3);
    expect(restored.value).toBe(16);
    expect(restored.mergedFrom).toBeNull();
  });

  it("drops previousPosition during serialization (transient animation data)", () => {
    // previousPosition and mergedFrom are intentionally excluded from TileData
    // because they are animation-only and not needed for persistence.
    const tile = { ...createTile({ x: 1, y: 1 }, 4), previousPosition: { x: 0, y: 1 } };
    const restored = deserializeTile(serializeTile(tile));
    // Serialized form only preserves x, y, value — previousPosition resets
    expect(restored.previousPosition).toBeNull();
    expect(restored.x).toBe(1);
    expect(restored.y).toBe(1);
    expect(restored.value).toBe(4);
  });

  it("serialized data is JSON-serializable (no circular references)", () => {
    const tile = createTile({ x: 0, y: 0 }, 32);
    const data = serializeTile(tile);
    expect(() => JSON.stringify(data)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// withinBounds
// ---------------------------------------------------------------------------

describe("withinBounds", () => {
  it("returns true for all valid positions", () => {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        expect(withinBounds({ x, y })).toBe(true);
      }
    }
  });

  it("returns false for negative x", () => {
    expect(withinBounds({ x: -1, y: 0 })).toBe(false);
  });

  it("returns false for negative y", () => {
    expect(withinBounds({ x: 0, y: -1 })).toBe(false);
  });

  it("returns false for x >= GRID_SIZE", () => {
    expect(withinBounds({ x: GRID_SIZE, y: 0 })).toBe(false);
  });

  it("returns false for y >= GRID_SIZE", () => {
    expect(withinBounds({ x: 0, y: GRID_SIZE })).toBe(false);
  });
});
