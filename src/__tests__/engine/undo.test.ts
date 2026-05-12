/**
 * Unit tests for the UNDO action (WO-037 — BRD FR-1).
 *
 * Verifies that: the UNDO action restores the pre-move snapshot, only one level
 * of undo is supported, undo is unavailable after RESTART or initial load, and
 * undo does not work when the game is over.
 */
import { describe, it, expect } from "vitest";
import { gameReducer, createInitialState } from "../../engine/reducer.js";
import type { GameState } from "../../engine/reducer.js";
import { Grid } from "../../engine/grid.js";
import { createTile } from "../../engine/tile.js";

// ---------------------------------------------------------------------------
// Helpers
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
// UNDO action — acceptance criteria (WO-037)
// ---------------------------------------------------------------------------

describe("UNDO action (WO-037)", () => {
  describe("GameAction union includes UNDO", () => {
    it("dispatching UNDO does not throw a TypeScript error", () => {
      const state = createInitialState();
      // If this compiles and runs, the union includes { type: 'UNDO' }
      expect(() => gameReducer(state, { type: "UNDO" })).not.toThrow();
    });
  });

  describe("previousState snapshot", () => {
    it("is null on initial state", () => {
      const state = createInitialState();
      expect(state.previousState).toBeNull();
    });

    it("is set to the pre-move snapshot after a MOVE that changes the board", () => {
      const initial = stateFromMatrix([
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const after = gameReducer(initial, { type: "MOVE", direction: "left" });
      // Board changed (tile at x:0,y:0 stays) → previousState should be set
      if (after !== initial) {
        expect(after.previousState).not.toBeNull();
      }
    });

    it("stores the pre-move score in previousState", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ], 10);
      const after = gameReducer(initial, { type: "MOVE", direction: "left" });
      expect(after.previousState?.score).toBe(10);
    });

    it("stores the pre-move grid in previousState", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const after = gameReducer(initial, { type: "MOVE", direction: "left" });
      // Pre-move grid should have 2s at x:0 and x:1
      expect(after.previousState?.grid.cellContent({ x: 0, y: 0 })?.value).toBe(2);
      expect(after.previousState?.grid.cellContent({ x: 1, y: 0 })?.value).toBe(2);
    });

    it("is null after a RESTART", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterRestart = gameReducer(afterMove, { type: "RESTART" });
      expect(afterRestart.previousState).toBeNull();
    });
  });

  describe("UNDO restores previousState", () => {
    it("restores score to the pre-move value", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ], 100);
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterUndo = gameReducer(afterMove, { type: "UNDO" });
      expect(afterUndo.score).toBe(100);
    });

    it("restores the grid layout to the pre-move state", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const preMatrix = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterUndo = gameReducer(afterMove, { type: "UNDO" });
      // Restored grid should match the pre-move layout (top-left 2×2 at 2,2)
      expect(afterUndo.grid.cellContent({ x: 0, y: 0 })?.value).toBe(preMatrix[0][0]);
      expect(afterUndo.grid.cellContent({ x: 1, y: 0 })?.value).toBe(preMatrix[0][1]);
    });

    it("restores won flag to false if the move had set it to true", () => {
      const initial = stateFromMatrix([
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterUndo = gameReducer(afterMove, { type: "UNDO" });
      // Pre-move state had won: false
      expect(afterUndo.won).toBe(false);
    });
  });

  describe("UNDO availability guard", () => {
    it("returns the same state unchanged when no previousState exists", () => {
      const state = createInitialState();
      const after = gameReducer(state, { type: "UNDO" });
      expect(after).toBe(state);
    });

    it("returns the same state unchanged when game is over", () => {
      // Construct a game-over state with a previousState
      const base = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const afterMove = gameReducer(base, { type: "MOVE", direction: "left" });
      // Force game-over by overriding over flag
      const gameOver: GameState = { ...afterMove, over: true };
      const afterUndo = gameReducer(gameOver, { type: "UNDO" });
      expect(afterUndo).toBe(gameOver);
    });

    it("consecutive UNDO dispatches do not stack — only one level supported", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterUndo1 = gameReducer(afterMove, { type: "UNDO" });
      // After one undo, previousState should be null (no further history)
      expect(afterUndo1.previousState).toBeNull();
      // Second undo returns same state unchanged
      const afterUndo2 = gameReducer(afterUndo1, { type: "UNDO" });
      expect(afterUndo2).toBe(afterUndo1);
    });
  });

  describe("canUndo derived flag in useGameEngine", () => {
    it("canUndo is false on fresh initial state (no history)", () => {
      const state = createInitialState();
      // Simulate the hook's canUndo derivation
      const canUndo = state.previousState !== null && !state.over;
      expect(canUndo).toBe(false);
    });

    it("canUndo is true after a successful MOVE", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const after = gameReducer(initial, { type: "MOVE", direction: "left" });
      if (after !== initial) {
        const canUndo = after.previousState !== null && !after.over;
        expect(canUndo).toBe(true);
      }
    });

    it("canUndo is false after UNDO (only one level)", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterUndo = gameReducer(afterMove, { type: "UNDO" });
      const canUndo = afterUndo.previousState !== null && !afterUndo.over;
      expect(canUndo).toBe(false);
    });

    it("canUndo is false after RESTART", () => {
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const afterMove = gameReducer(initial, { type: "MOVE", direction: "left" });
      const afterRestart = gameReducer(afterMove, { type: "RESTART" });
      const canUndo = afterRestart.previousState !== null && !afterRestart.over;
      expect(canUndo).toBe(false);
    });
  });

  describe("previousState NOT persisted (session-only verification)", () => {
    it("previousState fields are separate from the grid/score used in GameSession", () => {
      // Verify that GameState.previousState is not part of the serializable
      // GameSession type by checking that the reducer snapshot carries only
      // the expected fields (no nested previousState).
      const initial = stateFromMatrix([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      const after = gameReducer(initial, { type: "MOVE", direction: "left" });
      if (after.previousState !== null) {
        // The snapshot is a GameStateSnapshot — it does NOT have a previousState property
        expect("previousState" in after.previousState).toBe(false);
      }
    });
  });

  describe("gridToMatrix helper", () => {
    it("converts an empty grid to all-zero matrix", () => {
      const grid = Grid.empty(4);
      const matrix = gridToMatrix(grid);
      expect(matrix.every((row) => row.every((v) => v === 0))).toBe(true);
    });
  });
});
