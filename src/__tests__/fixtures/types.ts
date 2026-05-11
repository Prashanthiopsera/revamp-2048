/**
 * Types for game engine characterization fixtures (WO-012).
 * Used by the engine test suite (WO-030/031) to verify gameplay parity.
 */

/** 4×4 grid — each cell is a tile value or 0 (empty). */
export type GridState = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
];

export type Direction = "up" | "down" | "left" | "right";

export type GameAction =
  | { readonly type: "move"; readonly direction: Direction }
  | { readonly type: "restart" }
  | { readonly type: "continueAfterWin" };

export type FixtureCategory =
  | "basic_move"
  | "merge"
  | "cascade_prevention"
  | "score"
  | "win"
  | "keep_playing"
  | "game_over"
  | "spawn"
  | "serialization";

export interface GameFixture {
  /** Unique snake_case identifier. Must be unique across all fixture files. */
  readonly id: string;
  /** Human-readable explanation of what this fixture tests. */
  readonly description: string;
  readonly category: FixtureCategory;
  /** Board state before the action is applied. */
  readonly initial: GridState;
  readonly action: GameAction;
  readonly expected: {
    /** Board state after the action (before random spawn if spawnIsRandom). */
    readonly grid: GridState;
    /** Points earned this move (sum of all merged tile values). */
    readonly scoreDelta: number;
    /** True if no moves remain after this action. */
    readonly isOver: boolean;
    /** True if a 2048 tile was created by this move. */
    readonly isWon: boolean;
    /** True if the player is continuing after winning (keep-playing mode). */
    readonly isKeepingPlaying: boolean;
  };
  /**
   * When true, a random tile spawn follows this action.
   * The fixture only asserts the pre-spawn grid; spawn position is non-deterministic.
   */
  readonly spawnIsRandom?: true;
}
