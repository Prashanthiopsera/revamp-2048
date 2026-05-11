/**
 * useGameEngine — React hook bridging the pure game reducer to the component tree.
 *
 * Responsibilities:
 * - Initialize state from storage on mount (or create a fresh game), loading the
 *   persisted best score so the reducer carries it from the first render.
 * - Wrap `useReducer` with `gameReducer` so all state transitions are pure.
 * - Persist game state and best score to the storage adapter on every change.
 * - Clear saved game state when the game is over (so the next mount starts fresh).
 * - Expose derived flags `isGameTerminated` and `canContinue` to avoid
 *   duplicating logic in components.
 *
 * bestScore lives inside GameState (managed by the reducer) so the hook never
 * needs to call setState or read a ref during render — both of which trigger
 * lint violations under the react-hooks rules used in this project.
 *
 * This hook does NOT handle input events — that is `useInputHandler` (WO-016).
 */
import { useReducer, useEffect } from "react";
import { gameReducer, createInitialState } from "../engine/reducer.js";
import { storage } from "../storage.js";
import { Grid } from "../engine/grid.js";
import type { GameState, GameAction } from "../engine/reducer.js";
import type { TileData } from "../engine/tile.js";

// ---------------------------------------------------------------------------
// Hook output type
// ---------------------------------------------------------------------------

export interface UseGameEngineResult {
  /** Full game state — grid, score, flags. */
  readonly state: GameState;
  /** Dispatch a GameAction to the reducer. */
  readonly dispatch: React.Dispatch<GameAction>;
  /** Current score for this session. */
  readonly score: number;
  /** All-time best score across sessions. Tracked inside the reducer. */
  readonly bestScore: number;
  /** True when the game is over OR the player has won but not yet continued. */
  readonly isGameTerminated: boolean;
  /** True when the game was won and the player can still choose to continue. */
  readonly canContinue: boolean;
}

// ---------------------------------------------------------------------------
// Initialization helpers
// ---------------------------------------------------------------------------

/**
 * Converts the flat tile list from storage into a 4×4 cell matrix for Grid.fromState.
 */
function tilesToCellMatrix(
  tiles: readonly { id: number; value: number; row: number; col: number }[],
): (TileData | null)[][] {
  const matrix: (TileData | null)[][] = Array.from({ length: 4 }, () =>
    Array<TileData | null>(4).fill(null),
  );
  for (const tile of tiles) {
    if (tile.row >= 0 && tile.row < 4 && tile.col >= 0 && tile.col < 4) {
      matrix[tile.row][tile.col] = { x: tile.col, y: tile.row, value: tile.value };
    }
  }
  return matrix;
}

/**
 * Builds the initial GameState from storage, or creates a fresh game.
 * Called once as a lazy initializer for useReducer.
 *
 * The stored best score is always loaded so the reducer carries it from the
 * very first render — no extra useState / ref required.
 */
function buildInitialState(): GameState {
  const storedBestScore = storage.getBestScore();
  const saved = storage.getGameState();
  if (saved) {
    try {
      const grid = Grid.fromState({
        size: 4,
        cells: tilesToCellMatrix(saved.tiles),
      });
      return {
        grid,
        score: saved.score,
        bestScore: Math.max(storedBestScore, saved.score),
        over: saved.isOver,
        won: saved.isWon,
        isKeepingPlaying: saved.isKeepingPlaying,
      };
    } catch {
      // Corrupted saved state — fall back to fresh game
      storage.clearGameState();
    }
  }
  return createInitialState(4, storedBestScore);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameEngine(): UseGameEngineResult {
  const [state, dispatch] = useReducer(gameReducer, undefined, buildInitialState);

  // Persist state after every state change
  useEffect(() => {
    const tiles: { id: number; value: number; row: number; col: number }[] = [];
    let tileId = 0;
    state.grid.eachCell((x, y, tile) => {
      if (tile) {
        tiles.push({ id: tileId++, value: tile.value, row: y, col: x });
      }
    });

    if (state.over) {
      // Game over — clear saved game state so next mount starts fresh.
      // Best score is persisted separately and is never cleared.
      storage.clearGameState();
    } else {
      storage.setGameState({
        score: state.score,
        tiles,
        isOver: state.over,
        isWon: state.won,
        isKeepingPlaying: state.isKeepingPlaying,
      });
    }

    // Persist best score whenever the reducer updates it
    storage.setBestScore(state.bestScore);
  }, [state]);

  const isGameTerminated = state.over || (state.won && !state.isKeepingPlaying);
  const canContinue = state.won && !state.isKeepingPlaying && !state.over;

  return {
    state,
    dispatch,
    score: state.score,
    bestScore: state.bestScore,
    isGameTerminated,
    canContinue,
  };
}
