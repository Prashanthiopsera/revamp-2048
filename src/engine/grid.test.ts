import { describe, it, expect } from "vitest";
import { Grid } from "./grid.js";
import { createTile } from "./tile.js";

function makeGrid(): Grid {
  return Grid.empty(4);
}

function tile(x: number, y: number, value: number) {
  return createTile({ x, y }, value);
}

describe("engine/grid.ts (WO-013)", () => {
  describe("Grid.empty()", () => {
    it("creates a 4×4 grid of nulls", () => {
      const g = Grid.empty(4);
      expect(g.size).toBe(4);
      g.eachCell((_, __, t) => {
        expect(t).toBeNull();
      });
    });

    it("defaults to GRID_SIZE (4)", () => {
      expect(Grid.empty().size).toBe(4);
    });
  });

  describe("Grid.fromState() / serialize()", () => {
    it("serializes and deserializes a grid round-trip", () => {
      const g = makeGrid();
      const t = tile(1, 2, 128);
      g.insertTile(t);
      const restored = Grid.fromState(g.serialize());
      const cell = restored.cellContent({ x: 1, y: 2 });
      expect(cell).not.toBeNull();
      expect(cell?.value).toBe(128);
    });

    it("preserves empty cells", () => {
      const g = makeGrid();
      const restored = Grid.fromState(g.serialize());
      restored.eachCell((_, __, t) => {
        expect(t).toBeNull();
      });
    });

    it("serialize includes size and cells", () => {
      const data = makeGrid().serialize();
      expect(data.size).toBe(4);
      expect(data.cells).toHaveLength(4);
    });
  });

  describe("withinBounds()", () => {
    it("returns true for (0,0)", () => {
      expect(makeGrid().withinBounds({ x: 0, y: 0 })).toBe(true);
    });

    it("returns true for (3,3)", () => {
      expect(makeGrid().withinBounds({ x: 3, y: 3 })).toBe(true);
    });

    it("returns false for negative x", () => {
      expect(makeGrid().withinBounds({ x: -1, y: 0 })).toBe(false);
    });

    it("returns false for x = size", () => {
      expect(makeGrid().withinBounds({ x: 4, y: 0 })).toBe(false);
    });
  });

  describe("cellContent()", () => {
    it("returns null for empty cell", () => {
      expect(makeGrid().cellContent({ x: 0, y: 0 })).toBeNull();
    });

    it("returns the tile after insertion", () => {
      const g = makeGrid();
      const t = tile(2, 3, 64);
      g.insertTile(t);
      expect(g.cellContent({ x: 2, y: 3 })?.value).toBe(64);
    });

    it("returns null for out-of-bounds position", () => {
      expect(makeGrid().cellContent({ x: 99, y: 0 })).toBeNull();
    });
  });

  describe("cellAvailable() / cellOccupied()", () => {
    it("empty cell is available and not occupied", () => {
      const g = makeGrid();
      expect(g.cellAvailable({ x: 0, y: 0 })).toBe(true);
      expect(g.cellOccupied({ x: 0, y: 0 })).toBe(false);
    });

    it("occupied cell is not available", () => {
      const g = makeGrid();
      g.insertTile(tile(0, 0, 2));
      expect(g.cellAvailable({ x: 0, y: 0 })).toBe(false);
      expect(g.cellOccupied({ x: 0, y: 0 })).toBe(true);
    });
  });

  describe("availableCells() / cellsAvailable()", () => {
    it("empty grid has 16 available cells", () => {
      expect(makeGrid().availableCells()).toHaveLength(16);
    });

    it("cellsAvailable returns true for empty grid", () => {
      expect(makeGrid().cellsAvailable()).toBe(true);
    });

    it("full grid has 0 available cells", () => {
      const g = makeGrid();
      let id = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          g.insertTile(createTile({ x, y }, 2 + id));
          id++;
        }
      }
      expect(g.availableCells()).toHaveLength(0);
      expect(g.cellsAvailable()).toBe(false);
    });
  });

  describe("randomAvailableCell()", () => {
    it("returns a position within bounds", () => {
      const pos = makeGrid().randomAvailableCell();
      expect(pos).not.toBeNull();
      expect(pos?.x).toBeGreaterThanOrEqual(0);
      expect(pos?.x).toBeLessThan(4);
    });

    it("returns null for a full grid", () => {
      const g = makeGrid();
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          g.insertTile(createTile({ x, y }, 2));
        }
      }
      expect(g.randomAvailableCell()).toBeNull();
    });
  });

  describe("eachCell()", () => {
    it("visits all 16 cells", () => {
      let count = 0;
      makeGrid().eachCell(() => {
        count++;
      });
      expect(count).toBe(16);
    });

    it("passes correct x,y to the callback", () => {
      const visited: string[] = [];
      makeGrid().eachCell((x, y) => {
        visited.push(`${String(x)},${String(y)}`);
      });
      expect(visited).toContain("0,0");
      expect(visited).toContain("3,3");
      expect(visited).toHaveLength(16);
    });
  });

  describe("insertTile() / removeTile()", () => {
    it("insertTile places the tile at its coordinates", () => {
      const g = makeGrid();
      g.insertTile(tile(1, 2, 32));
      expect(g.cellContent({ x: 1, y: 2 })?.value).toBe(32);
    });

    it("removeTile empties the cell", () => {
      const g = makeGrid();
      const t = tile(0, 0, 4);
      g.insertTile(t);
      g.removeTile(t);
      expect(g.cellContent({ x: 0, y: 0 })).toBeNull();
    });

    it("insertTile ignores out-of-bounds tiles", () => {
      const g = makeGrid();
      g.insertTile(tile(99, 99, 2)); // should not throw
      expect(g.availableCells()).toHaveLength(16);
    });
  });

  describe("clone()", () => {
    it("produces an independent copy", () => {
      const g = makeGrid();
      g.insertTile(tile(0, 0, 4));
      const cloned = g.clone();
      cloned.insertTile(tile(1, 1, 8));
      expect(g.cellContent({ x: 1, y: 1 })).toBeNull();
    });
  });

  describe("addRandomTile()", () => {
    it("adds a tile to an empty grid", () => {
      const g = makeGrid();
      const t = g.addRandomTile();
      expect(t).not.toBeNull();
      expect(g.availableCells()).toHaveLength(15);
    });

    it("tile value is 2 or 4", () => {
      for (let i = 0; i < 20; i++) {
        const g = makeGrid();
        const t = g.addRandomTile();
        expect([2, 4]).toContain(t?.value);
      }
    });

    it("returns null for a full grid", () => {
      const g = makeGrid();
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          g.insertTile(createTile({ x, y }, 2));
        }
      }
      expect(g.addRandomTile()).toBeNull();
    });
  });
});
