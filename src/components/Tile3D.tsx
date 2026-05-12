/**
 * Tile3D — renders a single 2048 tile as a 3D box mesh using React Three Fiber.
 *
 * ## Appearance
 * - Position: converted from 2D grid coordinates (0-indexed) to 3D world space,
 *   centered at the origin so the board is centred in the scene.
 * - Height: `log2(value) * TILE_HEIGHT_UNIT` — higher value tiles are taller,
 *   providing visual depth cues without obscuring lower tiles.
 * - Colour: matches the 2D CSS colour scheme via a typed lookup map.
 * - Material: `MeshStandardMaterial` with slight metalness for depth perception.
 *
 * ## Animations
 * All animations run in a `useFrame` callback using linear interpolation:
 * - Position slide: current world position lerps toward target on every frame.
 * - New tile (no previousPosition): scale lerps from 0 → 1.
 * - Merged tile (mergedFrom set): scale lerps 0 → 1.3 → 1 for a bounce effect.
 *
 * ## Layout constants
 * These are local to the 3D scene and intentionally decoupled from the 2D SCSS
 * tile size — the 3D camera and projection determine apparent size.
 */
/* eslint-disable react-refresh/only-export-components */
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { GRID_SIZE, WIN_VALUE } from "../config.js";
import type { Tile } from "../engine/tile.js";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

export const CELL_SPACING = 1.3;      // distance between tile centres
export const TILE_HEIGHT_UNIT = 0.18; // multiplier: log2(value) × this = height
export const TILE_LERP_SPEED = 0.18;  // position lerp factor per frame

// Board is centred: half-board offset = (GRID_SIZE - 1) / 2 × CELL_SPACING
const BOARD_OFFSET = ((GRID_SIZE - 1) / 2) * CELL_SPACING;

// ---------------------------------------------------------------------------
// Colour map — matches 2D tile CSS colours
// ---------------------------------------------------------------------------

const TILE_COLORS: Readonly<Partial<Record<number, string>>> = {
  2:    "#eee4da",
  4:    "#ede0c8",
  8:    "#f2b179",
  16:   "#f59563",
  32:   "#f67c5f",
  64:   "#f65e3b",
  128:  "#edcf72",
  256:  "#edcc61",
  512:  "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
};

const SUPER_TILE_COLOR = "#3c3a32";

/**
 * Returns the hex colour for a given tile value, falling back to the super
 * tile colour for values beyond 2048.
 */
export function getTileColor(value: number): string {
  if (value <= WIN_VALUE) {
    return TILE_COLORS[value] ?? TILE_COLORS[2] ?? "#eee4da";
  }
  return SUPER_TILE_COLOR;
}

/**
 * Returns the height (y-dimension) of a tile box in world units.
 * Uses log2 so visual growth is perceptible but doesn't dominate the scene.
 */
export function getTileHeight(value: number): number {
  return Math.max(1, Math.log2(value)) * TILE_HEIGHT_UNIT;
}

/**
 * Converts a 2D grid position (0-indexed) to a 3D world x position.
 * Grid x=0 → negative, x=3 → positive, centred at 0.
 */
export function gridXToWorld(x: number): number {
  return x * CELL_SPACING - BOARD_OFFSET;
}

/**
 * Converts a 2D grid position (0-indexed) to a 3D world z position.
 * Grid y=0 → negative z, y=3 → positive z.
 */
export function gridYToWorld(y: number): number {
  return y * CELL_SPACING - BOARD_OFFSET;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface Tile3DProps {
  readonly tile: Tile;
  /**
   * When false, all animations (position lerp, scale-in, bounce) are skipped
   * and the tile is placed at its final position immediately. Set to false when
   * `prefers-reduced-motion` is active.
   */
  readonly animationsEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Tile3D({ tile, animationsEnabled = true }: Tile3DProps): React.ReactElement {
  const meshRef = useRef<Mesh>(null);

  const tileHeight = getTileHeight(tile.value);
  const targetX = gridXToWorld(tile.x);
  const targetZ = gridYToWorld(tile.y);
  const targetY = tileHeight / 2; // sit on the board surface

  // Determine animation type
  const isNew = tile.previousPosition === null && tile.mergedFrom === null;
  const isMerged = tile.mergedFrom !== null;

  // Track animation progress in a ref (0 = start, 1 = complete)
  const animProgressRef = useRef(isNew || isMerged ? 0 : 1);
  const isMergedRef = useRef(isMerged);

  // Reset animation when the tile identity changes (tile replaces another)
  useEffect(() => {
    if (isNew || isMerged) {
      animProgressRef.current = 0;
      isMergedRef.current = isMerged;
    }
  }, [isNew, isMerged]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!animationsEnabled) {
      // Skip animation — snap directly to final position and scale
      mesh.position.set(targetX, targetY, targetZ);
      mesh.scale.set(1, 1, 1);
      animProgressRef.current = 1;
      return;
    }

    // Position lerp — smooth slide to target
    mesh.position.x += (targetX - mesh.position.x) * TILE_LERP_SPEED;
    mesh.position.z += (targetZ - mesh.position.z) * TILE_LERP_SPEED;
    mesh.position.y += (targetY - mesh.position.y) * TILE_LERP_SPEED;

    // Scale animation
    if (animProgressRef.current < 1) {
      animProgressRef.current = Math.min(1, animProgressRef.current + 0.08);
      const p = animProgressRef.current;

      if (isMergedRef.current) {
        // Bounce: scale up to 1.3 at midpoint, then settle to 1
        const bounce = p < 0.5 ? p * 2 * 1.3 : 1.3 - (p * 2 - 1) * 0.3;
        mesh.scale.set(bounce, bounce, bounce);
      } else {
        // Appear: scale in from 0 to 1
        mesh.scale.set(p, p, p);
      }
    } else {
      mesh.scale.set(1, 1, 1);
    }
  });

  const initialScale: [number, number, number] =
    animationsEnabled && (isNew || isMerged) ? [0, 0, 0] : [1, 1, 1];

  return (
    <mesh
      ref={meshRef}
      position={[targetX, targetY, targetZ]}
      scale={initialScale}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, tileHeight, 1]} />
      <meshStandardMaterial
        color={getTileColor(tile.value)}
        metalness={0.1}
        roughness={0.6}
      />
    </mesh>
  );
}
