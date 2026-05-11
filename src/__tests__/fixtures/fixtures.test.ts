/**
 * Fixture validation tests (WO-012).
 *
 * These tests do NOT execute the game engine — they verify that:
 * - Every fixture has a unique ID
 * - Every required field is present and has the correct shape
 * - Grid states are valid 4×4 matrices of non-negative integers
 * - Score deltas are non-negative
 *
 * The engine tests (WO-030/031) will run the actual game logic against these fixtures.
 */
import { describe, it, expect } from "vitest";
import { fixtures } from "./game-fixtures.js";
import type { GameFixture, GridState } from "./types.js";

const VALID_CATEGORIES = new Set([
  "basic_move",
  "merge",
  "cascade_prevention",
  "score",
  "win",
  "keep_playing",
  "game_over",
  "spawn",
  "serialization",
]);

const VALID_DIRECTIONS = new Set(["up", "down", "left", "right"]);
const VALID_ACTION_TYPES = new Set(["move", "restart", "continueAfterWin"]);

function isValidGrid(grid: unknown): grid is GridState {
  if (!Array.isArray(grid) || grid.length !== 4) return false;
  return grid.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 4 &&
      row.every((cell) => typeof cell === "number" && cell >= 0 && Number.isInteger(cell)),
  );
}

describe("Game engine characterization fixtures (WO-012)", () => {
  it("has at least 15 fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(15);
  });

  it("all fixture IDs are unique", () => {
    const ids = fixtures.map((f) => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all fixture IDs are non-empty strings in snake_case format", () => {
    for (const fixture of fixtures) {
      expect(fixture.id).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("all fixtures have a non-empty description", () => {
    for (const fixture of fixtures) {
      expect(fixture.description.length, `fixture '${fixture.id}' needs a description`).toBeGreaterThan(
        0,
      );
    }
  });

  it("all fixtures have a valid category", () => {
    for (const fixture of fixtures) {
      expect(
        VALID_CATEGORIES.has(fixture.category),
        `fixture '${fixture.id}' has invalid category '${fixture.category}'`,
      ).toBe(true);
    }
  });

  it("all initial grids are valid 4×4 non-negative integer matrices", () => {
    for (const fixture of fixtures) {
      expect(
        isValidGrid(fixture.initial),
        `fixture '${fixture.id}' has an invalid initial grid`,
      ).toBe(true);
    }
  });

  it("all expected grids are valid 4×4 non-negative integer matrices", () => {
    for (const fixture of fixtures) {
      expect(
        isValidGrid(fixture.expected.grid),
        `fixture '${fixture.id}' has an invalid expected grid`,
      ).toBe(true);
    }
  });

  it("all score deltas are non-negative integers", () => {
    for (const fixture of fixtures) {
      expect(
        fixture.expected.scoreDelta >= 0 && Number.isInteger(fixture.expected.scoreDelta),
        `fixture '${fixture.id}' has invalid scoreDelta`,
      ).toBe(true);
    }
  });

  it("all actions have a valid type", () => {
    for (const fixture of fixtures) {
      expect(
        VALID_ACTION_TYPES.has(fixture.action.type),
        `fixture '${fixture.id}' has invalid action type '${fixture.action.type}'`,
      ).toBe(true);
    }
  });

  it("move actions have a valid direction", () => {
    const moveFixtures = fixtures.filter(
      (f): f is GameFixture & { action: { type: "move"; direction: string } } =>
        f.action.type === "move",
    );
    for (const fixture of moveFixtures) {
      expect(
        VALID_DIRECTIONS.has(fixture.action.direction),
        `fixture '${fixture.id}' has invalid direction '${fixture.action.direction}'`,
      ).toBe(true);
    }
  });

  it("all boolean expected fields are actual booleans", () => {
    for (const fixture of fixtures) {
      const { isOver, isWon, isKeepingPlaying } = fixture.expected;
      expect(typeof isOver, `fixture '${fixture.id}' isOver`).toBe("boolean");
      expect(typeof isWon, `fixture '${fixture.id}' isWon`).toBe("boolean");
      expect(typeof isKeepingPlaying, `fixture '${fixture.id}' isKeepingPlaying`).toBe("boolean");
    }
  });

  describe("coverage of required scenario categories", () => {
    const byCategory = (cat: string) => fixtures.filter((f) => f.category === cat);

    it("has basic_move fixtures covering all 4 directions", () => {
      const moveDirs = new Set(
        fixtures
          .filter((f) => f.category === "basic_move" && f.action.type === "move")
          .map((f) => (f.action as { direction: string }).direction),
      );
      expect(moveDirs.has("left")).toBe(true);
      expect(moveDirs.has("right")).toBe(true);
      expect(moveDirs.has("up")).toBe(true);
      expect(moveDirs.has("down")).toBe(true);
    });

    it("has at least 1 merge fixture", () => {
      expect(byCategory("merge").length).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 cascade_prevention fixture", () => {
      expect(byCategory("cascade_prevention").length).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 score fixture", () => {
      expect(byCategory("score").length).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 win fixture", () => {
      expect(byCategory("win").length).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 keep_playing fixture", () => {
      expect(byCategory("keep_playing").length).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 game_over fixture", () => {
      expect(byCategory("game_over").length).toBeGreaterThanOrEqual(1);
    });

    it("has at least 1 serialization fixture", () => {
      expect(byCategory("serialization").length).toBeGreaterThanOrEqual(1);
    });
  });
});
