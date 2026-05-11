import { describe, it, expect } from "vitest";
import {
  directionToVector,
  buildTraversals,
  findFarthestPosition,
  tileMatchesAvailable,
  movesAvailable,
  isWinningTile,
} from "./rules.js";
import { Grid } from "./grid.js";
import { createTile } from "./tile.js";

describe("engine/rules.ts (WO-014)", () => {
  describe("directionToVector()", () => {
    it("up → (0, -1)", () => {
      expect(directionToVector("up")).toEqual({ x: 0, y: -1 });
    });
    it("down → (0, 1)", () => {
      expect(directionToVector("down")).toEqual({ x: 0, y: 1 });
    });
    it("left → (-1, 0)", () => {
      expect(directionToVector("left")).toEqual({ x: -1, y: 0 });
    });
    it("right → (1, 0)", () => {
      expect(directionToVector("right")).toEqual({ x: 1, y: 0 });
    });
  });

  describe("buildTraversals()", () => {
    it("left: x traversal is [0,1,2,3]", () => {
      const { x } = buildTraversals({ x: -1, y: 0 });
      expect(x).toEqual([0, 1, 2, 3]);
    });

    it("right: x traversal is reversed [3,2,1,0]", () => {
      const { x } = buildTraversals({ x: 1, y: 0 });
      expect(x).toEqual([3, 2, 1, 0]);
    });

    it("up: y traversal is [0,1,2,3]", () => {
      const { y } = buildTraversals({ x: 0, y: -1 });
      expect(y).toEqual([0, 1, 2, 3]);
    });

    it("down: y traversal is reversed [3,2,1,0]", () => {
      const { y } = buildTraversals({ x: 0, y: 1 });
      expect(y).toEqual([3, 2, 1, 0]);
    });
  });

  describe("findFarthestPosition()", () => {
    it("tile at left edge moving left stays put", () => {
      const g = Grid.empty();
      g.insertTile(createTile({ x: 0, y: 0 }, 2));
      const result = findFarthestPosition(g, { x: 0, y: 0 }, { x: -1, y: 0 });
      expect(result.farthest).toEqual({ x: 0, y: 0 });
      expect(result.next).toBeNull();
    });

    it("tile in middle slides to left edge when row is empty", () => {
      const g = Grid.empty();
      const result = findFarthestPosition(g, { x: 2, y: 0 }, { x: -1, y: 0 });
      expect(result.farthest).toEqual({ x: 0, y: 0 });
    });

    it("tile stops before an occupied cell", () => {
      const g = Grid.empty();
      g.insertTile(createTile({ x: 0, y: 0 }, 4)); // blocker
      const result = findFarthestPosition(g, { x: 2, y: 0 }, { x: -1, y: 0 });
      expect(result.farthest).toEqual({ x: 1, y: 0 });
      // next is the position of the blocker
      expect(result.next).toEqual({ x: 0, y: 0 });
    });
  });

  describe("tileMatchesAvailable()", () => {
    it("returns true when adjacent tiles have same value", () => {
      const g = Grid.empty();
      g.insertTile(createTile({ x: 0, y: 0 }, 2));
      g.insertTile(createTile({ x: 1, y: 0 }, 2));
      expect(tileMatchesAvailable(g)).toBe(true);
    });

    it("returns false when no adjacent tiles match", () => {
      const g = Grid.empty();
      g.insertTile(createTile({ x: 0, y: 0 }, 2));
      g.insertTile(createTile({ x: 1, y: 0 }, 4));
      expect(tileMatchesAvailable(g)).toBe(false);
    });
  });

  describe("movesAvailable()", () => {
    it("returns true for an empty grid", () => {
      expect(movesAvailable(Grid.empty())).toBe(true);
    });

    it("returns false for a full grid with no matches", () => {
      const g = Grid.empty();
      const vals = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2] as const;
      let i = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          g.insertTile(createTile({ x, y }, vals[i] ?? 2));
          i++;
        }
      }
      expect(movesAvailable(g)).toBe(false);
    });
  });

  describe("isWinningTile()", () => {
    it("returns true when tile value equals win value", () => {
      expect(isWinningTile(createTile({ x: 0, y: 0 }, 2048), 2048)).toBe(true);
    });

    it("returns false when tile value is below win value", () => {
      expect(isWinningTile(createTile({ x: 0, y: 0 }, 1024), 2048)).toBe(false);
    });

    it("returns true when tile value exceeds win value (keep-playing)", () => {
      expect(isWinningTile(createTile({ x: 0, y: 0 }, 4096), 2048)).toBe(true);
    });
  });
});
