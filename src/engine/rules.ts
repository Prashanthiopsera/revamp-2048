/**
 * Pure rule functions for the 2048 game engine.
 *
 * These are extracted from the legacy game_manager.js and contain no side
 * effects — no random number generation, no state mutation, no I/O.
 * The reducer (reducer.ts) calls these to decide what to do.
 */
import { GRID_SIZE } from "../config.js";
import type { Grid } from "./grid.js";
import type { Tile, Position } from "./tile.js";

// ---------------------------------------------------------------------------
// Direction types
// ---------------------------------------------------------------------------

export type Direction = "up" | "down" | "left" | "right";

/** Axis-aligned unit vector for a move direction. */
export interface Vector {
  readonly x: -1 | 0 | 1;
  readonly y: -1 | 0 | 1;
}

export function directionToVector(direction: Direction): Vector {
  const map: Record<Direction, Vector> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  return map[direction];
}

// ---------------------------------------------------------------------------
// Traversal order
// ---------------------------------------------------------------------------

/**
 * Returns the ordered list of x and y indices to traverse when sliding tiles
 * in the given direction.
 *
 * The legacy rule: when moving right or down, process tiles starting from the
 * edge that tiles are sliding toward. This prevents tiles from "skipping over"
 * a freshly-merged tile.
 *
 * Matches the legacy `buildTraversals(vector)` logic in game_manager.js.
 */
export function buildTraversals(vector: Vector, size: number = GRID_SIZE): { x: number[]; y: number[] } {
  const xs = Array.from({ length: size }, (_, i) => i);
  const ys = Array.from({ length: size }, (_, i) => i);

  // Reverse the traversal order for the positive-direction axis so we process
  // from the destination edge inward (tiles move without collision).
  if (vector.x === 1) xs.reverse();
  if (vector.y === 1) ys.reverse();

  return { x: xs, y: ys };
}

// ---------------------------------------------------------------------------
// Farthest position
// ---------------------------------------------------------------------------

export interface FarthestResult {
  /** The last empty cell the tile can slide into. */
  readonly farthest: Position;
  /** The first occupied cell beyond farthest, or null if at the boundary. */
  readonly next: Position | null;
}

/**
 * Starting from `position`, walks in `vector`-direction until hitting a wall
 * or an occupied cell. Returns the farthest empty destination and the cell
 * beyond it (the potential merge target).
 *
 * Matches the legacy `findFarthestPosition(cell, vector)` in game_manager.js.
 */
export function findFarthestPosition(
  grid: Grid,
  position: Position,
  vector: Vector,
): FarthestResult {
  let previous: Position = position;
  let current: Position = { x: position.x + vector.x, y: position.y + vector.y };

  while (grid.withinBounds(current) && grid.cellAvailable(current)) {
    previous = current;
    current = { x: current.x + vector.x, y: current.y + vector.y };
  }

  return {
    farthest: previous,
    next: grid.withinBounds(current) ? current : null,
  };
}

// ---------------------------------------------------------------------------
// Move availability
// ---------------------------------------------------------------------------

/**
 * Returns true if at least one tile can merge with an adjacent tile.
 * Called when the grid is full to decide whether the game is over.
 *
 * Matches the legacy `tileMatchesAvailable()` in game_manager.js.
 */
export function tileMatchesAvailable(grid: Grid): boolean {
  const vectors: Vector[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];

  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      const tile = grid.cellContent({ x, y });
      if (!tile) continue;

      for (const vector of vectors) {
        const neighbor = grid.cellContent({ x: x + vector.x, y: y + vector.y });
        if (neighbor !== null && neighbor.value === tile.value) return true;
      }
    }
  }
  return false;
}

/**
 * Returns true if any move is possible — either empty cells exist or at least
 * one merge is available.
 *
 * Matches the legacy `movesAvailable()` in game_manager.js.
 */
export function movesAvailable(grid: Grid): boolean {
  return grid.cellsAvailable() || tileMatchesAvailable(grid);
}

// ---------------------------------------------------------------------------
// Win detection
// ---------------------------------------------------------------------------

/**
 * Returns true if the tile has reached the win value.
 * Isolated here so the win threshold can be changed in config.ts without
 * touching move logic.
 */
export function isWinningTile(tile: Tile, winValue: number): boolean {
  return tile.value >= winValue;
}
