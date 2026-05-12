/**
 * Tile — renders a single 2048 tile with CSS-class-based positioning and
 * animation state mirroring the legacy HTML actuator.
 *
 * ## Class naming (mirrors legacy game CSS)
 * - Position:  `tile-position-{col}-{row}` — 1-indexed, X = column, Y = row.
 * - Value:     `tile-{value}` e.g. `tile-2`, `tile-2048`.
 * - Value >2048: `tile-super` (tiles beyond the win value).
 * - New tile:   `tile-new` (no previousPosition, not a merge result).
 * - Merged:     `tile-merged` (created by merging two source tiles this move).
 *
 * ## Animation approach
 * React re-renders provide the final position. The CSS transition on
 * `.tile-inner` (transform) handles the slide. The `tile-new` / `tile-merged`
 * classes trigger CSS @keyframe animations (appear / pop).
 *
 * We also render the two source tiles for a merge with their final positions
 * so their slide animation completes before the merged tile appears. These
 * ghost tiles are rendered at z-index below the merged result.
 */
import type { Tile as TileModel } from "../engine/tile.js";
import { WIN_VALUE } from "../config.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TileProps {
  readonly tile: TileModel;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function positionClass(x: number, y: number): string {
  // CSS uses 1-indexed col/row
  return `tile-position-${String(x + 1)}-${String(y + 1)}`;
}

function valueClass(value: number): string {
  return `tile-${String(value)}`;
}

function animationClass(tile: TileModel): string {
  if (tile.mergedFrom !== null) return "tile-merged";
  if (tile.previousPosition === null) return "tile-new";
  return "";
}

function superClass(value: number): string {
  return value > WIN_VALUE ? "tile-super" : "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a single tile. When the tile was created by a merge, it also renders
 * the two source tiles (as "ghost" tiles with `tile-merged` class) so they
 * slide into the merged position before disappearing.
 */
export function Tile({ tile }: TileProps): React.ReactElement {
  const classes = [
    "tile",
    valueClass(tile.value),
    positionClass(tile.x, tile.y),
    animationClass(tile),
    superClass(tile.value),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* Ghost tiles for merge source animation */}
      {tile.mergedFrom?.map((source, i) => (
        <div
          key={i}
          className={[
            "tile",
            valueClass(source.value),
            // Render at final position (merged destination) so they "arrive" then disappear
            positionClass(tile.x, tile.y),
          ].join(" ")}
          aria-hidden="true"
        >
          <div className="tile-inner">{source.value}</div>
        </div>
      ))}

      {/* The actual tile */}
      <div
        className={classes}
        aria-label={String(tile.value)}
      >
        <div className="tile-inner">{tile.value}</div>
      </div>
    </>
  );
}
