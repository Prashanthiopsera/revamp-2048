/**
 * Tile module for the 2048 game engine.
 *
 * A Tile represents a numbered cell on the board. It is a value object —
 * game logic creates new Tile instances rather than mutating existing ones,
 * keeping the engine pure and easy to test.
 *
 * Mirrors the behavioral contract of the legacy tile.js while adding full
 * TypeScript type safety and an immutable-friendly API.
 */
import { GRID_SIZE } from "../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Row/column position on the grid. Both are 0-indexed. */
export interface Position {
  readonly x: number; // column index (0 = left)
  readonly y: number; // row index (0 = top)
}

/**
 * A tile on the 2048 board.
 *
 * - `previousPosition`: set before a move so the UI can animate the slide.
 * - `mergedFrom`: the two source tiles when this tile was created by a merge.
 *   Null on normal tiles and on tiles created by `spawnTile`.
 */
export interface Tile {
  readonly x: number;
  readonly y: number;
  readonly value: number;
  readonly previousPosition: Position | null;
  readonly mergedFrom: [Tile, Tile] | null;
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/**
 * Creates a new tile at the given position with the given value.
 * No previous position or merge history — used for initial spawns.
 */
export function createTile(position: Position, value: number): Tile {
  return { x: position.x, y: position.y, value, previousPosition: null, mergedFrom: null };
}

/**
 * Returns a copy of the tile with `previousPosition` set to its current
 * position. Called before each move so animations know where tiles came from.
 */
export function savePosition(tile: Tile): Tile {
  return { ...tile, previousPosition: { x: tile.x, y: tile.y } };
}

/**
 * Returns a copy of the tile at the new position.
 */
export function moveTile(tile: Tile, position: Position): Tile {
  return { ...tile, x: position.x, y: position.y };
}

/**
 * Returns a new tile that represents the merger of `a` and `b`.
 * The merged tile's value is `a.value + b.value` (always equal when called
 * from the engine). The `mergedFrom` field carries references to both source
 * tiles so the renderer can animate them collapsing.
 */
export function mergeTiles(a: Tile, b: Tile, position: Position): Tile {
  return {
    x: position.x,
    y: position.y,
    value: a.value + b.value,
    previousPosition: null,
    mergedFrom: [a, b],
  };
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serialized tile state — plain JSON-safe object for localStorage persistence.
 * Does not include `mergedFrom` (animation-only) or `previousPosition` (transient).
 */
export interface TileData {
  readonly x: number;
  readonly y: number;
  readonly value: number;
}

export function serializeTile(tile: Tile): TileData {
  return { x: tile.x, y: tile.y, value: tile.value };
}

export function deserializeTile(data: TileData): Tile {
  return createTile({ x: data.x, y: data.y }, data.value);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Returns true if the tile is within the bounds of an N×N grid.
 */
export function withinBounds(tile: Tile, size: number = GRID_SIZE): boolean {
  return tile.x >= 0 && tile.x < size && tile.y >= 0 && tile.y < size;
}
