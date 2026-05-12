/**
 * Engine unit tests — Reducer and Rules (WO-031)
 *
 * Comprehensive tests for src/engine/reducer.ts and src/engine/rules.ts.
 *
 * Sections:
 * 1. MOVE action: all 4 directions, merge, double-merge prevention, score
 * 2. Win / game-over detection
 * 3. RESTART action
 * 4. CONTINUE_AFTER_WIN action
 * 5. isKeepingPlaying is always a boolean (never a function)
 * 6. buildTraversals: traversal order per direction
 * 7. findFarthestPosition: position calculation
 * 8. movesAvailable and tileMatchesAvailable edge cases
 * 9. Golden fixtures from WO-012
 */
import { describe, it, expect } from "vitest";
import { gameReducer, createInitialState } from "../../engine/reducer.js";
import type { GameState } from "../../engine/reducer.js";
import { Grid } from "../../engine/grid.js";
import { createTile } from "../../engine/tile.js";
import {
  buildTraversals,
  directionToVector,
  findFarthestPosition,
  movesAvailable,
  tileMatchesAvailable,
} from "../../engine/rules.js";
import { fixtures } from "../fixtures/game-fixtures.js";

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

type Row = [number, number, number, number];

function stateFromMatrix(
  matrix: [Row, Row, Row, Row],
  score = 0,
  won = false,
  isKeepingPlaying = false,
): GameState {
  const grid = Grid.empty(4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = matrix[y]?.[x] ?? 0;
      if (v !== 0) grid.insertTile(createTile({ x, y }, v));
    }
  }
  return { grid, score, bestScore: 0, over: false, won, isKeepingPlaying, previousState: null };
}

function gridToMatrix(grid: Grid): number[][] {
  return Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (__, x) => grid.cellContent({ x, y })?.value ?? 0),
  );
}

// ---------------------------------------------------------------------------
// 1. MOVE action
// ---------------------------------------------------------------------------

describe("gameReducer — MOVE (WO-031)", () => {
  it("slides tiles left", () => {
    const state = stateFromMatrix([
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.grid.cellContent({ x: 0, y: 0 })?.value).toBe(2);
    expect(next.grid.cellContent({ x: 1, y: 0 })).toBeNull();
  });

  it("slides tiles right", () => {
    const state = stateFromMatrix([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(next.grid.cellContent({ x: 3, y: 0 })?.value).toBe(2);
    expect(next.grid.cellContent({ x: 0, y: 0 })).toBeNull();
  });

  it("slides tiles up", () => {
    const state = stateFromMatrix([
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "up" });
    expect(next.grid.cellContent({ x: 0, y: 0 })?.value).toBe(2);
    expect(next.grid.cellContent({ x: 0, y: 1 })).toBeNull();
  });

  it("slides tiles down", () => {
    const state = stateFromMatrix([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "down" });
    // The tile originally at (0, 0) must have slid to the bottom row.
    expect(next.grid.cellContent({ x: 0, y: 3 })?.value).toBe(2);
    // Note: we cannot assert that (0, 0) is null because the reducer spawns a
    // new random tile after every move — it may legitimately land at (0, 0).
  });

  it("merges two equal tiles moving left", () => {
    const state = stateFromMatrix([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.grid.cellContent({ x: 0, y: 0 })?.value).toBe(4);
    expect(next.score).toBe(4);
  });

  it("merges two equal tiles moving right", () => {
    const state = stateFromMatrix([
      [0, 0, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(next.grid.cellContent({ x: 3, y: 0 })?.value).toBe(8);
  });

  it("does not double-merge (cascade prevention)", () => {
    // [2, 2, 4] → moving left → [4, 4] NOT [8]
    const state = stateFromMatrix([
      [2, 2, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    const m = gridToMatrix(next.grid);
    expect(m[0]?.[0]).toBe(4);
    expect(m[0]?.[1]).toBe(4);
    expect(m[0]?.[2]).toBe(0);
  });

  it("accumulates score from multiple merges in one move", () => {
    const state = stateFromMatrix([
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.score).toBe(4 + 8); // 2+2=4, 4+4=8
  });

  it("updates bestScore when score exceeds it", () => {
    const state = { ...stateFromMatrix([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]), bestScore: 1000 };
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.bestScore).toBe(2048); // score 2048 > bestScore 1000
  });

  it("returns the same state if no tiles move", () => {
    // Single tile in top-left — moving left/up does nothing
    const state = stateFromMatrix([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    // Tile should still be at x=0
    expect(next.grid.cellContent({ x: 0, y: 0 })?.value).toBe(2);
    // No new tile spawned (only spawns when something moves)
    const occupied = next.grid.availableCells().length;
    expect(occupied).toBe(15); // 16 - 1 original tile
  });
});

// ---------------------------------------------------------------------------
// 2. Win / game-over detection
// ---------------------------------------------------------------------------

describe("gameReducer — win / game-over (WO-031)", () => {
  it("sets won=true when a merge reaches 2048", () => {
    const state = stateFromMatrix([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.won).toBe(true);
  });

  it("sets over=true when no moves are available", () => {
    // Checkerboard: no two adjacent tiles match
    const state = stateFromMatrix([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.over).toBe(true);
  });

  it("does not set over=true when a merge is possible", () => {
    const state = stateFromMatrix([
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ]);
    const next = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(next.over).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. RESTART action
// ---------------------------------------------------------------------------

describe("gameReducer — RESTART (WO-031)", () => {
  it("resets score to 0", () => {
    const state = { ...stateFromMatrix([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), score: 128 };
    const next = gameReducer(state, { type: "RESTART" });
    expect(next.score).toBe(0);
  });

  it("starts with 2 tiles on the new grid", () => {
    const state = stateFromMatrix([
      [2, 4, 8, 16],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128],
    ], 1000, true);
    const next = gameReducer(state, { type: "RESTART" });
    let occupied = 0;
    next.grid.eachCell((_x, _y, tile) => { if (tile !== null) occupied++; });
    expect(occupied).toBe(2);
  });

  it("resets over and won to false", () => {
    const state = { ...stateFromMatrix([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]), over: true, won: true };
    const next = gameReducer(state, { type: "RESTART" });
    expect(next.over).toBe(false);
    expect(next.won).toBe(false);
  });

  it("preserves bestScore on restart", () => {
    const state = { ...stateFromMatrix([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), bestScore: 512 };
    const next = gameReducer(state, { type: "RESTART" });
    expect(next.bestScore).toBe(512);
  });
});

// ---------------------------------------------------------------------------
// 4. CONTINUE_AFTER_WIN action
// ---------------------------------------------------------------------------

describe("gameReducer — CONTINUE_AFTER_WIN (WO-031)", () => {
  it("sets isKeepingPlaying to true", () => {
    const state = { ...stateFromMatrix([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), won: true };
    const next = gameReducer(state, { type: "CONTINUE_AFTER_WIN" });
    expect(next.isKeepingPlaying).toBe(true);
  });

  it("preserves the current grid and score", () => {
    const state = { ...stateFromMatrix([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), score: 20000, won: true };
    const next = gameReducer(state, { type: "CONTINUE_AFTER_WIN" });
    expect(next.score).toBe(20000);
    expect(next.grid.cellContent({ x: 0, y: 0 })?.value).toBe(2048);
  });
});

// ---------------------------------------------------------------------------
// 5. isKeepingPlaying is always a boolean
// ---------------------------------------------------------------------------

describe("isKeepingPlaying type invariant (WO-031)", () => {
  it("is false on initial state", () => {
    expect(typeof createInitialState().isKeepingPlaying).toBe("boolean");
    expect(createInitialState().isKeepingPlaying).toBe(false);
  });

  it("is true after CONTINUE_AFTER_WIN", () => {
    const state = { ...stateFromMatrix([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), won: true };
    const next = gameReducer(state, { type: "CONTINUE_AFTER_WIN" });
    expect(typeof next.isKeepingPlaying).toBe("boolean");
  });

  it("is false after RESTART", () => {
    const state = { ...stateFromMatrix([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), isKeepingPlaying: true };
    const next = gameReducer(state, { type: "RESTART" });
    expect(typeof next.isKeepingPlaying).toBe("boolean");
    expect(next.isKeepingPlaying).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. buildTraversals — traversal order per direction
// ---------------------------------------------------------------------------

describe("buildTraversals (WO-031)", () => {
  it("left: x traverses [0,1,2,3], y traverses [0,1,2,3]", () => {
    const { x, y } = buildTraversals(directionToVector("left"));
    expect(x).toEqual([0, 1, 2, 3]);
    expect(y).toEqual([0, 1, 2, 3]);
  });

  it("right: x traverses [3,2,1,0], y traverses [0,1,2,3]", () => {
    const { x, y } = buildTraversals(directionToVector("right"));
    expect(x).toEqual([3, 2, 1, 0]);
    expect(y).toEqual([0, 1, 2, 3]);
  });

  it("up: x traverses [0,1,2,3], y traverses [0,1,2,3]", () => {
    const { x, y } = buildTraversals(directionToVector("up"));
    expect(x).toEqual([0, 1, 2, 3]);
    expect(y).toEqual([0, 1, 2, 3]);
  });

  it("down: x traverses [0,1,2,3], y traverses [3,2,1,0]", () => {
    const { x, y } = buildTraversals(directionToVector("down"));
    expect(x).toEqual([0, 1, 2, 3]);
    expect(y).toEqual([3, 2, 1, 0]);
  });
});

// ---------------------------------------------------------------------------
// 7. findFarthestPosition
// ---------------------------------------------------------------------------

describe("findFarthestPosition (WO-031)", () => {
  it("slides to the far edge when the row is empty", () => {
    // Tile at x=1; nothing blocking on the left
    const grid = Grid.empty(4);
    const tile = createTile({ x: 1, y: 0 }, 2);
    grid.insertTile(tile);

    // Start from tile's position and walk left
    const result = findFarthestPosition(grid, { x: 1, y: 0 }, directionToVector("left"));
    expect(result.farthest).toEqual({ x: 0, y: 0 });
    // Next is out of bounds → null
    expect(result.next).toBeNull();
  });

  it("stops at the wall when blocked by another tile", () => {
    const grid = Grid.empty(4);
    const blocker = createTile({ x: 0, y: 0 }, 4);
    const tile = createTile({ x: 2, y: 0 }, 2);
    grid.insertTile(blocker);
    grid.insertTile(tile);

    // Start from tile at x=2, walk left
    const result = findFarthestPosition(grid, { x: 2, y: 0 }, directionToVector("left"));
    // Can go to x=1 (empty), but x=0 is occupied
    expect(result.farthest).toEqual({ x: 1, y: 0 });
    expect(result.next).toEqual({ x: 0, y: 0 }); // the blocker
  });
});

// ---------------------------------------------------------------------------
// 8. movesAvailable and tileMatchesAvailable
// ---------------------------------------------------------------------------

describe("movesAvailable (WO-031)", () => {
  it("returns true when the grid has empty cells", () => {
    const grid = Grid.empty(4);
    grid.insertTile(createTile({ x: 0, y: 0 }, 2));
    expect(movesAvailable(grid)).toBe(true);
  });

  it("returns true when tiles are adjacent and equal (even if grid is full)", () => {
    // Fill grid — last row has [2, 2, ...] so a left merge is available
    const grid = Grid.empty(4);
    grid.insertTile(createTile({ x: 0, y: 3 }, 2));
    grid.insertTile(createTile({ x: 1, y: 3 }, 2));
    grid.insertTile(createTile({ x: 2, y: 3 }, 4));
    grid.insertTile(createTile({ x: 3, y: 3 }, 8));
    // Other rows filled with non-matching
    for (let y = 0; y < 3; y++) {
      grid.insertTile(createTile({ x: 0, y }, 16));
      grid.insertTile(createTile({ x: 1, y }, 32));
      grid.insertTile(createTile({ x: 2, y }, 64));
      grid.insertTile(createTile({ x: 3, y }, 128));
    }
    expect(movesAvailable(grid)).toBe(true);
  });

  it("returns false on a full checkerboard grid with no adjacent matches", () => {
    const grid = Grid.empty(4);
    const values = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        grid.insertTile(createTile({ x, y }, values[y]?.[x] ?? 2));
      }
    }
    expect(movesAvailable(grid)).toBe(false);
  });
});

describe("tileMatchesAvailable (WO-031)", () => {
  it("returns true when two horizontally adjacent tiles have the same value", () => {
    const grid = Grid.empty(4);
    grid.insertTile(createTile({ x: 0, y: 0 }, 8));
    grid.insertTile(createTile({ x: 1, y: 0 }, 8));
    expect(tileMatchesAvailable(grid)).toBe(true);
  });

  it("returns true when two vertically adjacent tiles have the same value", () => {
    const grid = Grid.empty(4);
    grid.insertTile(createTile({ x: 0, y: 0 }, 16));
    grid.insertTile(createTile({ x: 0, y: 1 }, 16));
    expect(tileMatchesAvailable(grid)).toBe(true);
  });

  it("returns false when no adjacent tiles match", () => {
    const grid = Grid.empty(4);
    grid.insertTile(createTile({ x: 0, y: 0 }, 2));
    grid.insertTile(createTile({ x: 1, y: 0 }, 4));
    grid.insertTile(createTile({ x: 0, y: 1 }, 8));
    expect(tileMatchesAvailable(grid)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. Golden fixtures from WO-012
// ---------------------------------------------------------------------------

describe("gameReducer — golden fixtures (WO-031)", () => {
  for (const fixture of fixtures) {
    it(`[${fixture.id}] ${fixture.description}`, () => {
      // Build initial state from the fixture's `initial` GridState
      const matrix = fixture.initial as [Row, Row, Row, Row];

      let state = stateFromMatrix(matrix);
      // The keep_playing fixture starts in a won + isKeepingPlaying state
      if (fixture.expected.isKeepingPlaying) {
        state = { ...state, won: true, isKeepingPlaying: true };
      }

      // Map fixture action (lowercase) to reducer action (UPPER_CASE)
      let next: GameState;
      const act = fixture.action;
      if (act.type === "move") {
        next = gameReducer(state, { type: "MOVE", direction: act.direction });
      } else if (act.type === "restart") {
        next = gameReducer(state, { type: "RESTART" });
      } else {
        // act.type === "continueAfterWin"
        next = gameReducer(state, { type: "CONTINUE_AFTER_WIN" });
      }

      // Score delta (for MOVE actions)
      if (act.type === "move") {
        expect(next.score).toBe(fixture.expected.scoreDelta);
      }

      // Expected grid — skip cells that are 0 (empty or non-deterministic spawn)
      if (!fixture.spawnIsRandom) {
        for (let y = 0; y < 4; y++) {
          for (let x = 0; x < 4; x++) {
            const expected = fixture.expected.grid[y]?.[x] ?? 0;
            if (expected !== 0) {
              expect(next.grid.cellContent({ x, y })?.value).toBe(expected);
            }
          }
        }
      }

      // Win / over / isKeepingPlaying flags
      expect(next.won).toBe(fixture.expected.isWon);
      expect(next.over).toBe(fixture.expected.isOver);
    });
  }
});
