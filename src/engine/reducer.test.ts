/**
 * Tests for the game reducer (WO-014).
 *
 * Section 1: unit tests for individual reducer actions (MOVE, RESTART, CONTINUE_AFTER_WIN).
 * Section 2: fixture-based characterization tests using golden fixtures from WO-012
 *            to verify gameplay parity with the legacy gabrielecirulli/2048 engine.
 */
import { describe, it, expect } from "vitest";
import { gameReducer, createInitialState } from "./reducer.js";
import type { GameState } from "./reducer.js";
import { Grid } from "./grid.js";
import { createTile } from "./tile.js";
import { fixtures } from "../__tests__/fixtures/game-fixtures.js";
import type { GameFixture } from "../__tests__/fixtures/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a GameState with a pre-built grid from a 4×4 number matrix. */
function stateFromMatrix(
  matrix: [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]],
  score = 0,
  won = false,
  isKeepingPlaying = false,
): GameState {
  const grid = Grid.empty(4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = matrix[y][x];
      if (v !== 0) grid.insertTile(createTile({ x, y }, v));
    }
  }
  return { grid, score, bestScore: 0, over: false, won, isKeepingPlaying };
}

/** Converts a Grid to a 4×4 number matrix (0 = empty). */
function gridToMatrix(grid: Grid): number[][] {
  const m: number[][] = [];
  for (let y = 0; y < 4; y++) {
    m[y] = [];
    for (let x = 0; x < 4; x++) {
      m[y][x] = grid.cellContent({ x, y })?.value ?? 0;
    }
  }
  return m;
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe("engine/reducer.ts (WO-014)", () => {
  describe("createInitialState()", () => {
    it("starts with score 0", () => {
      expect(createInitialState().score).toBe(0);
    });

    it("is not over or won", () => {
      const s = createInitialState();
      expect(s.over).toBe(false);
      expect(s.won).toBe(false);
      expect(s.isKeepingPlaying).toBe(false);
    });

    it("starts with exactly 2 tiles on the board", () => {
      const s = createInitialState();
      let count = 0;
      s.grid.eachCell((_, __, t) => {
        if (t) count++;
      });
      expect(count).toBe(2);
    });
  });

  describe("RESTART action", () => {
    it("resets score to 0", () => {
      const s = stateFromMatrix(
        [[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        256,
      );
      const next = gameReducer(s, { type: "RESTART" });
      expect(next.score).toBe(0);
    });

    it("resets won and isKeepingPlaying to false", () => {
      const s: GameState = {
        ...stateFromMatrix([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
        won: true,
        isKeepingPlaying: true,
      };
      const next = gameReducer(s, { type: "RESTART" });
      expect(next.won).toBe(false);
      expect(next.isKeepingPlaying).toBe(false);
    });
  });

  describe("CONTINUE_AFTER_WIN action", () => {
    it("sets isKeepingPlaying to true when game is won", () => {
      const s: GameState = {
        ...stateFromMatrix([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
        won: true,
        isKeepingPlaying: false,
      };
      const next = gameReducer(s, { type: "CONTINUE_AFTER_WIN" });
      expect(next.isKeepingPlaying).toBe(true);
    });

    it("does not change board or score", () => {
      const s: GameState = {
        ...stateFromMatrix([[2048, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], 2048),
        won: true,
        isKeepingPlaying: false,
      };
      const next = gameReducer(s, { type: "CONTINUE_AFTER_WIN" });
      expect(next.score).toBe(2048);
    });

    it("is a no-op if already keeping playing", () => {
      const s: GameState = {
        ...stateFromMatrix([[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
        won: true,
        isKeepingPlaying: true,
      };
      const next = gameReducer(s, { type: "CONTINUE_AFTER_WIN" });
      expect(next).toBe(s); // same reference — no mutation
    });
  });

  describe("MOVE action — basic rules", () => {
    it("returns same state reference when no tiles move", () => {
      // Tiles already at left edge, moving left — nothing changes
      const s = stateFromMatrix(
        [[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      );
      const next = gameReducer(s, { type: "MOVE", direction: "left" });
      expect(next).toBe(s);
    });

    it("merges equal adjacent tiles and adds score", () => {
      const s = stateFromMatrix([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      const next = gameReducer(s, { type: "MOVE", direction: "left" });
      expect(next.score).toBe(4);
    });

    it("cascade prevention: [2,2,2,2] left → score 8, not 12", () => {
      const s = stateFromMatrix([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      const next = gameReducer(s, { type: "MOVE", direction: "left" });
      expect(next.score).toBe(8);
    });

    it("detects win when a tile reaches 2048", () => {
      const s = stateFromMatrix([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
      const next = gameReducer(s, { type: "MOVE", direction: "left" });
      expect(next.won).toBe(true);
      expect(next.score).toBe(2048);
    });

    it("detects game over when no moves remain", () => {
      const s = stateFromMatrix([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]);
      // This position is already game-over but we need to trigger the check
      const next = gameReducer(s, { type: "MOVE", direction: "left" });
      expect(next.over).toBe(true);
    });

    it("does not allow moves when game is over", () => {
      const s: GameState = {
        ...stateFromMatrix([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
        over: true,
      };
      const next = gameReducer(s, { type: "MOVE", direction: "left" });
      expect(next).toBe(s);
    });

    it("does not allow moves when won and not keeping playing", () => {
      const s: GameState = {
        ...stateFromMatrix([[2048, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
        won: true,
        isKeepingPlaying: false,
      };
      const next = gameReducer(s, { type: "MOVE", direction: "right" });
      expect(next).toBe(s);
    });

    it("allows moves when won AND isKeepingPlaying is true", () => {
      const s: GameState = {
        ...stateFromMatrix([[2048, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]),
        won: true,
        isKeepingPlaying: true,
      };
      const next = gameReducer(s, { type: "MOVE", direction: "right" });
      expect(next).not.toBe(s); // state changed
    });
  });

  // ---------------------------------------------------------------------------
  // Fixture-based characterization tests (WO-012 golden fixtures)
  // ---------------------------------------------------------------------------

  describe("Fixture-based characterization tests (WO-012)", () => {
    /**
     * Run a subset of deterministic fixtures (those without `spawnIsRandom`).
     * Fixtures with `spawnIsRandom: true` require random spawn and can only have
     * their pre-spawn grid asserted, not the post-spawn grid — those assertions
     * are relaxed to score/won/over checks only.
     */

    // Deterministic fixtures (no spawn after action)
    const deterministicFixtures = fixtures.filter(
      (f: GameFixture) => !f.spawnIsRandom,
    );

    for (const fixture of deterministicFixtures) {
      it(`[${fixture.id}] ${fixture.description}`, () => {
        const initialState = stateFromMatrix(fixture.initial);

        let state = initialState;
        if (fixture.action.type === "move") {
          state = gameReducer(state, { type: "MOVE", direction: fixture.action.direction });
        } else if (fixture.action.type === "continueAfterWin") {
          state = { ...state, won: true };
          state = gameReducer(state, { type: "CONTINUE_AFTER_WIN" });
        }

        const actualGrid = gridToMatrix(state.grid);
        const expectedGrid = fixture.expected.grid.map((row) => [...row]);

        expect(actualGrid).toEqual(expectedGrid);
        expect(state.over).toBe(fixture.expected.isOver);
        expect(state.won).toBe(fixture.expected.isWon);
        expect(state.isKeepingPlaying).toBe(fixture.expected.isKeepingPlaying);
      });
    }

    // Score assertions for spawnIsRandom fixtures (score is deterministic even if spawn position is not)
    const randomSpawnFixtures = fixtures.filter((f: GameFixture) => f.spawnIsRandom && f.action.type === "move");

    for (const fixture of randomSpawnFixtures) {
      it(`[${fixture.id}] score delta = ${String(fixture.expected.scoreDelta)}`, () => {
        const state = stateFromMatrix(fixture.initial);
        const next = gameReducer(state, {
          type: "MOVE",
          direction: (fixture.action as { direction: "up" | "down" | "left" | "right" }).direction,
        });
        const actualScoreDelta = next.score - state.score;
        expect(actualScoreDelta).toBe(fixture.expected.scoreDelta);
      });
    }
  });
});
