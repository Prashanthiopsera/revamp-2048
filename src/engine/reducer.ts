/**
 * Game reducer for the 2048 engine.
 *
 * All state transitions go through `gameReducer` — a pure function that takes
 * the current state and a typed action and returns new state. No side effects.
 *
 * ## keepPlaying fix (REQ-009)
 * The legacy game_manager.js used `this.keepPlaying` for both a boolean state
 * flag AND a method name (`keepPlaying()`), causing a runtime type-shifting
 * collision. Here the state field is named `isKeepingPlaying` and continuation
 * is a `CONTINUE_AFTER_WIN` action — no collision possible.
 */
import {
  GRID_SIZE,
  WIN_VALUE,
  STARTING_TILE_COUNT,
  SPAWN_PROBABILITY_OF_TWO,
} from "../config.js";
import { Grid } from "./grid.js";
import { savePosition, moveTile, mergeTiles } from "./tile.js";
import {
  directionToVector,
  buildTraversals,
  findFarthestPosition,
  movesAvailable,
  isWinningTile,
} from "./rules.js";
import type { Direction } from "./rules.js";
import type { Tile } from "./tile.js";

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

/**
 * Complete game state — everything needed to render and persist a game session.
 *
 * Data classification: Public — tile positions and score only.
 */
export interface GameState {
  readonly grid: Grid;
  readonly score: number;
  /** All-time best score across restarts. Persisted separately from game state. */
  readonly bestScore: number;
  /** True when no moves remain. */
  readonly over: boolean;
  /** True when a tile has reached WIN_VALUE. */
  readonly won: boolean;
  /**
   * True when the player explicitly continues after winning.
   *
   * Renamed from the legacy `keepPlaying` boolean to avoid the method/property
   * collision in game_manager.js where `this.keepPlaying` was both a flag and
   * a method reference.
   */
  readonly isKeepingPlaying: boolean;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type GameAction =
  | { readonly type: "MOVE"; readonly direction: Direction }
  | { readonly type: "RESTART" }
  | { readonly type: "CONTINUE_AFTER_WIN" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a fresh game state with STARTING_TILE_COUNT random tiles. */
export function createInitialState(size: number = GRID_SIZE, bestScore = 0): GameState {
  const grid = Grid.empty(size);
  for (let i = 0; i < STARTING_TILE_COUNT; i++) {
    grid.addRandomTile(SPAWN_PROBABILITY_OF_TWO);
  }
  return { grid, score: 0, bestScore, over: false, won: false, isKeepingPlaying: false };
}

// ---------------------------------------------------------------------------
// Move logic (pure — takes a Grid clone, returns mutations)
// ---------------------------------------------------------------------------

interface MoveResult {
  readonly grid: Grid;
  readonly scoreDelta: number;
  readonly won: boolean;
  readonly moved: boolean;
}

/**
 * Applies a slide-and-merge move in the given direction to a **clone** of the
 * grid. Returns the mutated grid, score delta, win flag, and whether any tile
 * actually moved.
 *
 * Algorithm matches the legacy `game_manager.move()`:
 * 1. Save each tile's current position (for animation).
 * 2. For each tile in traversal order, find its farthest destination.
 * 3. If the next cell holds a same-value tile that hasn't merged yet → merge.
 * 4. Otherwise → slide to farthest.
 * 5. After all tiles are resolved, add one random tile if any tile moved.
 */
function applyMove(grid: Grid, direction: Direction): MoveResult {
  const vector = directionToVector(direction);
  const traversals = buildTraversals(vector, grid.size);

  let scoreDelta = 0;
  let won = false;
  let moved = false;

  // Track which tiles were merged this move — a merged tile cannot merge again
  const mergedThisMove = new Set<Tile>();

  // Snapshot all current tiles with their saved positions before moving
  // so we can compare final positions to detect actual movement.
  const initialPositions = new Map<Tile, { x: number; y: number }>();
  grid.eachCell((x, y, tile) => {
    if (tile) initialPositions.set(tile, { x, y });
  });

  // Save positions for animation (mirrors legacy `self.prepareTiles()`)
  grid.eachCell((_x, _y, tile) => {
    if (tile) {
      grid.removeTile(tile);
      grid.insertTile(savePosition(tile));
    }
  });

  // Process each cell in traversal order
  for (const y of traversals.y) {
    for (const x of traversals.x) {
      const tile = grid.cellContent({ x, y });
      if (!tile) continue;

      const { farthest, next } = findFarthestPosition(grid, { x, y }, vector);
      const nextTile = next !== null ? grid.cellContent(next) : null;

      if (
        nextTile !== null &&
        nextTile.value === tile.value &&
        !mergedThisMove.has(nextTile) &&
        next !== null
      ) {
        // Merge: create new tile at the target position
        const merged = mergeTiles(tile, nextTile, next);
        grid.removeTile(tile);
        grid.removeTile(nextTile);
        grid.insertTile(merged);

        mergedThisMove.add(merged);
        scoreDelta += merged.value;

        if (isWinningTile(merged, WIN_VALUE)) won = true;
        moved = true;
      } else {
        // Slide: move to farthest empty position
        if (farthest.x !== x || farthest.y !== y) {
          grid.removeTile(tile);
          grid.insertTile(moveTile(tile, farthest));
          moved = true;
        }
      }
    }
  }

  // Spawn a random tile if the board changed
  if (moved) {
    grid.addRandomTile(SPAWN_PROBABILITY_OF_TWO);
  }

  return { grid, scoreDelta, won, moved };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * Pure game state reducer.
 *
 * @example
 * const next = gameReducer(state, { type: 'MOVE', direction: 'left' });
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE": {
      // Ignore moves when the game is over or won (unless keep-playing)
      if (state.over || (state.won && !state.isKeepingPlaying)) return state;

      const gridClone = state.grid.clone();
      const { grid, scoreDelta, won, moved } = applyMove(gridClone, action.direction);

      if (!moved) {
        // Even on a no-op move, detect if the board is already game-over so
        // that a board restored from storage in a game-over position is
        // correctly recognized. state.over is always false here (we returned
        // early above if it was true), so no need to guard against it.
        if (!movesAvailable(state.grid)) {
          return { ...state, over: true };
        }
        return state;
      }

      const newScore = state.score + scoreDelta;
      const newBestScore = Math.max(state.bestScore, newScore);
      const isOver = !movesAvailable(grid);
      const isWon = state.won || won; // Win is sticky

      return {
        grid,
        score: newScore,
        bestScore: newBestScore,
        over: isOver,
        won: isWon,
        isKeepingPlaying: state.isKeepingPlaying,
      };
    }

    case "CONTINUE_AFTER_WIN": {
      // Only valid when the game was won and the player hasn't continued yet
      if (!state.won || state.isKeepingPlaying) return state;
      return { ...state, isKeepingPlaying: true };
    }

    case "RESTART": {
      // Preserve bestScore across restarts — it is an all-time record.
      return createInitialState(state.grid.size, state.bestScore);
    }
  }
}
