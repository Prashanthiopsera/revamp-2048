/**
 * Grid module for the 2048 game engine.
 *
 * The Grid is the authoritative representation of the board state.
 * It is a class (not a plain object) because it carries a cells matrix and
 * exposes the query/mutation methods that game rules depend on.
 *
 * Methods match the behavioral contract of the legacy grid.js exactly so that
 * the characterization test fixtures (WO-012) pass unchanged.
 *
 * Mutation policy: methods like `insertTile` and `removeTile` mutate the Grid
 * in place. Callers that need immutability should call `grid.clone()` first.
 * The reducer (WO-014) owns the immutability boundary.
 */
import { GRID_SIZE } from "../config.js";
import {
  createTile,
  serializeTile,
  deserializeTile,
  withinBounds,
} from "./tile.js";
import type { Tile, Position, TileData } from "./tile.js";

// ---------------------------------------------------------------------------
// Serialized grid shape
// ---------------------------------------------------------------------------

export interface GridData {
  readonly size: number;
  readonly cells: readonly (TileData | null)[][];
}

// ---------------------------------------------------------------------------
// Safe array access helper (avoids non-null assertions on known-valid indices)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Grid class
// ---------------------------------------------------------------------------

export class Grid {
  readonly size: number;
  /** Row-major: cells[y][x]. Each cell is a Tile or null (empty). */
  cells: (Tile | null)[][];

  constructor(size: number = GRID_SIZE) {
    this.size = size;
    this.cells = Array.from({ length: size }, () => Array<Tile | null>(size).fill(null));
  }

  // -------------------------------------------------------------------------
  // Factory methods
  // -------------------------------------------------------------------------

  /** Creates an empty grid of the given size. */
  static empty(size: number = GRID_SIZE): Grid {
    return new Grid(size);
  }

  /**
   * Reconstructs a grid from serialized data.
   * Mirrors the legacy `Grid(previousState)` constructor branch.
   */
  static fromState(data: GridData): Grid {
    const grid = new Grid(data.size);
    for (let y = 0; y < data.size; y++) {
      for (let x = 0; x < data.size; x++) {
        const cellData = data.cells[y]?.[x];
        // Direct 2D array write — bounds guaranteed by the loop
        grid.cells[y][x] = cellData ? deserializeTile(cellData) : null;
      }
    }
    return grid;
  }

  // -------------------------------------------------------------------------
  // Cell queries
  // -------------------------------------------------------------------------

  /** Returns true if the position is within the grid bounds. */
  withinBounds(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }

  /** Returns the tile at the given position, or null if empty / out-of-bounds. */
  cellContent(position: Position): Tile | null {
    if (!this.withinBounds(position)) return null;
    return this.cells[position.y][position.x] ?? null;
  }

  /** Returns true if the cell at the given position is empty. */
  cellAvailable(position: Position): boolean {
    return this.cellContent(position) === null;
  }

  /** Returns true if the cell at the given position is occupied. */
  cellOccupied(position: Position): boolean {
    return !this.cellAvailable(position);
  }

  /** Returns all empty cell positions. */
  availableCells(): Position[] {
    const cells: Position[] = [];
    this.eachCell((x, y, tile) => {
      if (tile === null) cells.push({ x, y });
    });
    return cells;
  }

  /** Returns true if at least one cell is empty. */
  cellsAvailable(): boolean {
    return this.availableCells().length > 0;
  }

  /**
   * Returns a random empty cell position, or null if the grid is full.
   * The legacy `randomAvailableCell()` picks uniformly from available cells.
   */
  randomAvailableCell(): Position | null {
    const cells = this.availableCells();
    if (cells.length === 0) return null;
    const idx = Math.floor(Math.random() * cells.length);
    return cells[idx] ?? null;
  }

  /**
   * Iterates every cell in row-major order, calling the callback with
   * (x, y, tile) for each. Matches the legacy `eachCell(callback)` signature.
   */
  eachCell(callback: (x: number, y: number, tile: Tile | null) => void): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        callback(x, y, this.cells[y][x] ?? null);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Tile mutations
  // -------------------------------------------------------------------------

  /** Places a tile in the grid at the tile's own (x, y) coordinates. */
  insertTile(tile: Tile): void {
    if (this.withinBounds(tile)) {
      this.cells[tile.y][tile.x] = tile;
    }
  }

  /** Removes the tile from the grid at its own (x, y) coordinates. */
  removeTile(tile: Tile): void {
    if (this.withinBounds(tile)) {
      this.cells[tile.y][tile.x] = null;
    }
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------

  /** Returns a plain JSON-safe object for localStorage persistence. */
  serialize(): GridData {
    return {
      size: this.size,
      cells: this.cells.map((r) => r.map((tile) => (tile ? serializeTile(tile) : null))),
    };
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  /** Returns a deep copy of this grid — use before applying mutations. */
  clone(): Grid {
    return Grid.fromState(this.serialize());
  }

  /**
   * Adds a random tile (value 2 with probability 0.9, else 4) to a random
   * empty cell. Returns the spawned tile or null if the grid is full.
   * Mirrors `addRandomTile()` from the legacy game_manager.js.
   */
  addRandomTile(spawnProbabilityOfTwo = 0.9): Tile | null {
    const position = this.randomAvailableCell();
    if (!position) return null;
    const value = Math.random() < spawnProbabilityOfTwo ? 2 : 4;
    const tile = createTile(position, value);
    this.insertTile(tile);
    return tile;
  }
}

// ---------------------------------------------------------------------------
// Re-export tile types so consumers only need to import from grid.ts
// ---------------------------------------------------------------------------

export type { Tile, Position, TileData };
export { createTile, serializeTile, deserializeTile, withinBounds };
