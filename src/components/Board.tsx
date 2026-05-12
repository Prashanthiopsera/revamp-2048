/**
 * Board — renders the 4×4 grid background and all active tiles.
 *
 * ## Structure (mirrors legacy index.html)
 * ```
 * <div class="game-container">       ← outer; receives game-won/game-over overlay classes
 *   <div class="grid-container">     ← background cells
 *     <div class="grid-row">
 *       <div class="grid-cell" />    ← GRID_SIZE × GRID_SIZE empty background cells
 *     </div>
 *   </div>
 *   <div class="tile-container">     ← live tiles rendered over the background
 *     <Tile tile={...} />
 *   </div>
 * </div>
 * ```
 *
 * ## Tile collection
 * The grid's `eachCell` visits every cell and yields the Tile at that position
 * (or null). We collect all non-null tiles and render them. When a tile was
 * merged this move it carries a `mergedFrom` pair — the Tile component renders
 * ghost tiles for those source tiles so the slide animation completes.
 *
 * ## Key stability
 * Tiles do not have stable IDs in the current engine model, so we generate a
 * key from position (`{x}-{y}`). This is sufficient because at most one tile
 * occupies each cell at any point in time, and the grid is fully re-rendered
 * after each move.
 */
import { Tile } from "./Tile.js";
import { GRID_SIZE } from "../config.js";
import type { Grid } from "../engine/grid.js";
import type { Tile as TileModel } from "../engine/tile.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoardProps {
  /** Current grid state from the game reducer. */
  readonly grid: Grid;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generates the static background cell grid (GRID_SIZE × GRID_SIZE cells). */
function BackgroundGrid(): React.ReactElement {
  const rows = Array.from({ length: GRID_SIZE }, (_, r) => r);
  const cols = Array.from({ length: GRID_SIZE }, (_, c) => c);

  return (
    <div className="grid-container" aria-hidden="true">
      {rows.map((r) => (
        <div key={r} className="grid-row">
          {cols.map((c) => (
            <div key={c} className="grid-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders the game board: background cells + active tiles.
 *
 * The outer `<div>` is the same `game-container` div that the legacy game uses,
 * so existing CSS (positioning, transitions, responsive breakpoints) applies
 * without modification.
 */
export function Board({ grid }: BoardProps): React.ReactElement {
  // Collect all active tiles from the grid
  const tiles: TileModel[] = [];
  grid.eachCell((_x, _y, tile) => {
    if (tile !== null) tiles.push(tile);
  });

  return (
    <div className="game-container" data-testid="board">
      <BackgroundGrid />
      <div className="tile-container" aria-label="Game tiles">
        {tiles.map((tile) => (
          <Tile key={`${String(tile.x)}-${String(tile.y)}`} tile={tile} />
        ))}
      </div>
    </div>
  );
}
