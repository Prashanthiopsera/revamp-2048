/**
 * Engine unit tests — Grid (WO-030)
 *
 * Covers: empty grid creation, tile insertion/removal, cell content query,
 * bounds checking, available cells count, serialization round-trip,
 * fromState reconstruction, and addRandomTile behaviour.
 */
import { describe, it, expect } from "vitest";
import { Grid } from "../../engine/grid.js";
import { createTile } from "../../engine/tile.js";
import { GRID_SIZE } from "../../config.js";

// ---------------------------------------------------------------------------
// Empty grid creation
// ---------------------------------------------------------------------------

describe("Grid.empty()", () => {
  it(`creates a ${String(GRID_SIZE)}x${String(GRID_SIZE)} grid`, () => {
    const grid = Grid.empty();
    let count = 0;
    grid.eachCell(() => { count++; });
    expect(count).toBe(GRID_SIZE * GRID_SIZE);
  });

  it("starts with all cells empty (null)", () => {
    const grid = Grid.empty();
    let occupied = 0;
    grid.eachCell((_x, _y, tile) => { if (tile !== null) occupied++; });
    expect(occupied).toBe(0);
  });

  it("reports cells are available", () => {
    const grid = Grid.empty();
    expect(grid.cellsAvailable()).toBe(true);
  });

  it("all available cells are within bounds", () => {
    const grid = Grid.empty();
    const cells = grid.availableCells();
    for (const cell of cells) {
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.x).toBeLessThan(GRID_SIZE);
      expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.y).toBeLessThan(GRID_SIZE);
    }
  });

  it(`has ${String(GRID_SIZE * GRID_SIZE)} available cells`, () => {
    const grid = Grid.empty();
    expect(grid.availableCells()).toHaveLength(GRID_SIZE * GRID_SIZE);
  });
});

// ---------------------------------------------------------------------------
// Tile insertion
// ---------------------------------------------------------------------------

describe("insertTile", () => {
  it("places the tile at the correct cell", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 1, y: 2 }, 4);
    grid.insertTile(tile);
    expect(grid.cellContent({ x: 1, y: 2 })).not.toBeNull();
    expect(grid.cellContent({ x: 1, y: 2 })?.value).toBe(4);
  });

  it("marks the cell as occupied", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 0, y: 0 }, 2);
    grid.insertTile(tile);
    expect(grid.cellOccupied({ x: 0, y: 0 })).toBe(true);
  });

  it("reduces available cell count by 1", () => {
    const grid = Grid.empty();
    const before = grid.availableCells().length;
    grid.insertTile(createTile({ x: 2, y: 2 }, 8));
    expect(grid.availableCells()).toHaveLength(before - 1);
  });

  it("does not affect other cells", () => {
    const grid = Grid.empty();
    grid.insertTile(createTile({ x: 1, y: 1 }, 16));
    expect(grid.cellContent({ x: 0, y: 0 })).toBeNull();
    expect(grid.cellContent({ x: 3, y: 3 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tile removal
// ---------------------------------------------------------------------------

describe("removeTile", () => {
  it("clears the cell after removal", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 2, y: 2 }, 32);
    grid.insertTile(tile);
    grid.removeTile(tile);
    expect(grid.cellContent({ x: 2, y: 2 })).toBeNull();
  });

  it("marks the cell as available after removal", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 0, y: 3 }, 64);
    grid.insertTile(tile);
    grid.removeTile(tile);
    expect(grid.cellAvailable({ x: 0, y: 3 })).toBe(true);
  });

  it("increases available cell count by 1 after removal", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 3, y: 3 }, 128);
    grid.insertTile(tile);
    const before = grid.availableCells().length;
    grid.removeTile(tile);
    expect(grid.availableCells()).toHaveLength(before + 1);
  });
});

// ---------------------------------------------------------------------------
// Cell content queries
// ---------------------------------------------------------------------------

describe("cellContent", () => {
  it("returns null for an empty cell", () => {
    const grid = Grid.empty();
    expect(grid.cellContent({ x: 0, y: 0 })).toBeNull();
  });

  it("returns null for out-of-bounds positions", () => {
    const grid = Grid.empty();
    expect(grid.cellContent({ x: -1, y: 0 })).toBeNull();
    expect(grid.cellContent({ x: GRID_SIZE, y: 0 })).toBeNull();
  });

  it("returns the tile after insertion", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 1, y: 3 }, 256);
    grid.insertTile(tile);
    const content = grid.cellContent({ x: 1, y: 3 });
    expect(content?.value).toBe(256);
  });
});

// ---------------------------------------------------------------------------
// Bounds checking
// ---------------------------------------------------------------------------

describe("withinBounds", () => {
  it("returns true for corner positions", () => {
    const grid = Grid.empty();
    expect(grid.withinBounds({ x: 0, y: 0 })).toBe(true);
    expect(grid.withinBounds({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })).toBe(true);
  });

  it("returns false for negative indices", () => {
    const grid = Grid.empty();
    expect(grid.withinBounds({ x: -1, y: 0 })).toBe(false);
    expect(grid.withinBounds({ x: 0, y: -1 })).toBe(false);
  });

  it("returns false for indices at or beyond GRID_SIZE", () => {
    const grid = Grid.empty();
    expect(grid.withinBounds({ x: GRID_SIZE, y: 0 })).toBe(false);
    expect(grid.withinBounds({ x: 0, y: GRID_SIZE })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Serialization round-trip
// ---------------------------------------------------------------------------

describe("serialize / fromState", () => {
  it("round-trips an empty grid", () => {
    const grid = Grid.empty();
    const data = grid.serialize();
    const restored = Grid.fromState(data);
    let occupiedCount = 0;
    restored.eachCell((_x, _y, tile) => { if (tile !== null) occupiedCount++; });
    expect(occupiedCount).toBe(0);
  });

  it("round-trips a grid with tiles", () => {
    const grid = Grid.empty();
    grid.insertTile(createTile({ x: 0, y: 0 }, 2));
    grid.insertTile(createTile({ x: 3, y: 3 }, 512));

    const data = grid.serialize();
    const restored = Grid.fromState(data);

    expect(restored.cellContent({ x: 0, y: 0 })?.value).toBe(2);
    expect(restored.cellContent({ x: 3, y: 3 })?.value).toBe(512);
    expect(restored.cellContent({ x: 1, y: 1 })).toBeNull();
  });

  it("serialized data is JSON-serializable", () => {
    const grid = Grid.empty();
    grid.insertTile(createTile({ x: 2, y: 2 }, 64));
    expect(() => JSON.stringify(grid.serialize())).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// fromState reconstruction
// ---------------------------------------------------------------------------

describe("Grid.fromState()", () => {
  it("reconstructs a grid matching the original state", () => {
    const original = Grid.empty();
    original.insertTile(createTile({ x: 1, y: 2 }, 32));
    original.insertTile(createTile({ x: 2, y: 1 }, 64));

    const state = original.serialize();
    const restored = Grid.fromState(state);

    expect(restored.cellContent({ x: 1, y: 2 })?.value).toBe(32);
    expect(restored.cellContent({ x: 2, y: 1 })?.value).toBe(64);
  });

  it("restored grid has correct available cell count", () => {
    const original = Grid.empty();
    original.insertTile(createTile({ x: 0, y: 0 }, 4));
    original.insertTile(createTile({ x: 1, y: 1 }, 4));

    const restored = Grid.fromState(original.serialize());
    expect(restored.availableCells()).toHaveLength(GRID_SIZE * GRID_SIZE - 2);
  });
});

// ---------------------------------------------------------------------------
// clone
// ---------------------------------------------------------------------------

describe("Grid.clone()", () => {
  it("produces an independent copy", () => {
    const grid = Grid.empty();
    grid.insertTile(createTile({ x: 0, y: 0 }, 8));
    const clone = grid.clone();

    // Modify original — clone should not change
    grid.insertTile(createTile({ x: 1, y: 1 }, 16));
    expect(clone.cellContent({ x: 1, y: 1 })).toBeNull();
  });

  it("clone has the same tiles as the original", () => {
    const grid = Grid.empty();
    grid.insertTile(createTile({ x: 2, y: 3 }, 128));
    const clone = grid.clone();
    expect(clone.cellContent({ x: 2, y: 3 })?.value).toBe(128);
  });
});

// ---------------------------------------------------------------------------
// addRandomTile
// ---------------------------------------------------------------------------

describe("addRandomTile", () => {
  it("adds a tile with value 2 or 4", () => {
    const grid = Grid.empty();
    const tile = grid.addRandomTile();
    expect(tile).not.toBeNull();
    expect([2, 4]).toContain(tile?.value ?? -1);
  });

  it("places the tile in a previously empty cell", () => {
    const grid = Grid.empty();
    const tile = grid.addRandomTile();
    if (tile !== null) {
      expect(grid.cellContent({ x: tile.x, y: tile.y })).not.toBeNull();
    }
  });

  it("returns null when the grid is full", () => {
    const grid = Grid.empty();
    // Fill all cells
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        grid.insertTile(createTile({ x, y }, 2));
      }
    }
    expect(grid.addRandomTile()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// eachCell
// ---------------------------------------------------------------------------

describe("eachCell", () => {
  it("visits every cell in the grid", () => {
    const grid = Grid.empty();
    const visited = new Set<string>();
    grid.eachCell((x, y) => {
      visited.add(`${String(x)},${String(y)}`);
    });
    expect(visited.size).toBe(GRID_SIZE * GRID_SIZE);
  });

  it("passes the tile reference to the callback", () => {
    const grid = Grid.empty();
    const tile = createTile({ x: 1, y: 1 }, 512);
    grid.insertTile(tile);

    let foundValue: number | null = null;
    grid.eachCell((_x, _y, t) => {
      if (t !== null) foundValue = t.value;
    });
    expect(foundValue).toBe(512);
  });
});
