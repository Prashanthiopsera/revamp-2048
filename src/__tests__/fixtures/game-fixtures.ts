/**
 * Golden test fixtures for the 2048 game engine (WO-012).
 *
 * Rules captured from legacy gabrielecirulli/2048 source:
 * - game_manager.js: move(), addRandomTile(), isGameTerminated(), keepPlaying
 * - grid.js: eachCell(), availableCells(), cellsAvailable(), tileMatchesAvailable()
 * - tile.js: mergeWith(), savePosition(), updatePosition()
 *
 * Tiles slide to the edge first, then equal adjacent tiles merge (once per move).
 * Score = sum of all merged tile values. Win = any tile reaches 2048.
 * Game over = no empty cells AND no adjacent equal tiles remain.
 */
import type { GameFixture } from "./types.js";

export const fixtures: readonly GameFixture[] = [
  // -------------------------------------------------------------------------
  // Basic moves — single direction, no merges
  // -------------------------------------------------------------------------
  {
    id: "move_left_no_merge",
    description: "Tiles slide left with no merges — all tiles reach the leftmost empty position",
    category: "basic_move",
    initial: [
      [0, 0, 0, 2],
      [0, 0, 4, 0],
      [0, 8, 0, 0],
      [16, 0, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [2, 0, 0, 0],
        [4, 0, 0, 0],
        [8, 0, 0, 0],
        [16, 0, 0, 0],
      ],
      scoreDelta: 0,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },
  {
    id: "move_right_no_merge",
    description: "Tiles slide right with no merges",
    category: "basic_move",
    initial: [
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 8, 0],
      [0, 0, 0, 16],
    ],
    action: { type: "move", direction: "right" },
    expected: {
      grid: [
        [0, 0, 0, 2],
        [0, 0, 0, 4],
        [0, 0, 0, 8],
        [0, 0, 0, 16],
      ],
      scoreDelta: 0,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },
  {
    id: "move_up_no_merge",
    description: "Tiles slide up with no merges",
    category: "basic_move",
    initial: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 4, 8, 16],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "up" },
    expected: {
      grid: [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 0,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },
  {
    id: "move_down_no_merge",
    description: "Tiles slide down with no merges",
    category: "basic_move",
    initial: [
      [0, 0, 0, 0],
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "down" },
    expected: {
      grid: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 4, 8, 16],
      ],
      scoreDelta: 0,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },

  // -------------------------------------------------------------------------
  // Single merge
  // -------------------------------------------------------------------------
  {
    id: "merge_single_left",
    description: "Two equal tiles merge into one when moving left; score = merged value",
    category: "merge",
    initial: [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [4, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 4,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },
  {
    id: "merge_single_right",
    description: "Two equal tiles merge moving right",
    category: "merge",
    initial: [
      [0, 0, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "right" },
    expected: {
      grid: [
        [0, 0, 0, 8],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 8,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },
  {
    id: "merge_with_gap_left",
    description: "Tiles slide over gaps before merging",
    category: "merge",
    initial: [
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [4, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 4,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },

  // -------------------------------------------------------------------------
  // Double merge in one row
  // -------------------------------------------------------------------------
  {
    id: "double_merge_left",
    description: "Two separate pairs merge independently in a single move",
    category: "merge",
    initial: [
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [4, 8, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 12, // 4 + 8
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },

  // -------------------------------------------------------------------------
  // Cascade prevention — no double-merge per tile per move
  // -------------------------------------------------------------------------
  {
    id: "cascade_prevention_left",
    description:
      "A merged tile cannot merge again in the same move — [2,2,2,2] → [4,4] not [8]",
    category: "cascade_prevention",
    initial: [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [4, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 8, // 4 + 4
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },
  {
    id: "cascade_prevention_right",
    description: "[2,2,2,2] moving right → [0,0,4,4] not [0,0,0,8]",
    category: "cascade_prevention",
    initial: [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "right" },
    expected: {
      grid: [
        [0, 0, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 8,
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },

  // -------------------------------------------------------------------------
  // Score accumulation
  // -------------------------------------------------------------------------
  {
    id: "score_multi_row_merges",
    description: "Score accumulates across all merges in all rows in a single move",
    category: "score",
    initial: [
      [2, 2, 0, 0],
      [4, 4, 0, 0],
      [8, 8, 0, 0],
      [16, 16, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [4, 0, 0, 0],
        [8, 0, 0, 0],
        [16, 0, 0, 0],
        [32, 0, 0, 0],
      ],
      scoreDelta: 60, // 4 + 8 + 16 + 32
      isOver: false,
      isWon: false,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },

  // -------------------------------------------------------------------------
  // Win detection
  // -------------------------------------------------------------------------
  {
    id: "win_detection",
    description: "Merging two 1024 tiles creates a 2048 tile and triggers win",
    category: "win",
    initial: [
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 2048,
      isOver: false,
      isWon: true,
      isKeepingPlaying: false,
    },
    spawnIsRandom: true,
  },

  // -------------------------------------------------------------------------
  // Keep-playing continuation
  // -------------------------------------------------------------------------
  {
    id: "keep_playing_after_win",
    description: "After winning, player can continue — isWon stays true, isKeepingPlaying true",
    category: "keep_playing",
    initial: [
      [2048, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    action: { type: "continueAfterWin" },
    expected: {
      // Board unchanged by continueAfterWin — it just sets the flag
      grid: [
        [2048, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      scoreDelta: 0,
      isOver: false,
      isWon: true,
      isKeepingPlaying: true,
    },
  },

  // -------------------------------------------------------------------------
  // Game-over detection
  // -------------------------------------------------------------------------
  {
    id: "game_over_no_moves",
    description: "Full board with no adjacent equal tiles — game over",
    category: "game_over",
    initial: [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ],
    action: { type: "move", direction: "left" },
    expected: {
      // No slide or merge possible; board is unchanged and game is over
      grid: [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ],
      scoreDelta: 0,
      isOver: true,
      isWon: false,
      isKeepingPlaying: false,
    },
  },

  // -------------------------------------------------------------------------
  // Grid serialization round-trip
  // -------------------------------------------------------------------------
  {
    id: "serialization_round_trip",
    description:
      "A board with varied tile values serializes and deserializes without data loss",
    category: "serialization",
    initial: [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, 4096],
      [8192, 0, 0, 0],
    ],
    // No-op move (move left when all tiles are in leftmost position already)
    action: { type: "move", direction: "left" },
    expected: {
      grid: [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 0, 0, 0],
      ],
      scoreDelta: 0,
      isOver: false,
      // No merge occurs in this move — the reducer only sets won=true when a
      // tile reaches WIN_VALUE via a merge. A 2048 tile pre-existing on the
      // board does not retroactively trigger the win flag.
      isWon: false,
      isKeepingPlaying: false,
    },
  },
];
