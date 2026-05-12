/**
 * Board3D — renders the full 2048 board in 3D using React Three Fiber.
 *
 * This module is intentionally only imported through `React.lazy()` from
 * `Board3DLazy.tsx`. The import of `@react-three/fiber` (which pulls in Three.js
 * and WebGL shaders) is therefore deferred until the user switches to 3D mode,
 * keeping the initial JS bundle small.
 *
 * ## Scene layout
 * - Camera: 45° perspective, placed above and slightly behind the board.
 * - Lighting: ambient fill + directional key light from above-right.
 * - Board background: a flat grey plane of the same footprint as the tile grid.
 * - Tiles: each active tile is rendered as a `Tile3D` box mesh.
 *
 * ## Quality reduction
 * When `isQualityReduced` is true (sustained low FPS detected by the parent):
 * - The WebGL pixel ratio is capped at 1.0 via `useThree().gl.setPixelRatio`.
 * - Shadows are disabled on all lights and meshes, reducing GPU draw calls.
 * - Quality resets automatically when the prop returns to false (user re-enters 3D mode).
 *
 * ## Accessibility
 * The containing `<div>` carries `role="img"` and an `aria-label` so screen
 * readers can describe the board region. The Canvas itself is hidden from
 * the a11y tree (`aria-hidden`).
 */
import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { GRID_SIZE } from "../config.js";
import type { Grid } from "../engine/grid.js";
import { Tile3D, CELL_SPACING } from "./Tile3D.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Total visual footprint of the board in world units
const BOARD_SIZE = (GRID_SIZE - 1) * CELL_SPACING + 1;

// Camera sits above and behind the board, tilted down at ~50°
const CAMERA_POSITION: [number, number, number] = [0, 8, 7];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface Board3DProps {
  readonly grid: Grid;
  /**
   * When true, the WebGL renderer applies quality reduction:
   * pixel ratio capped to 1.0 and shadows disabled.
   */
  readonly isQualityReduced?: boolean;
  /**
   * When false, tile animations (position lerp, scale-in, bounce) are skipped.
   * Set to false when `prefers-reduced-motion` is active.
   */
  readonly animationsEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Internal: quality controller (must be inside Canvas to access useThree)
// ---------------------------------------------------------------------------

interface QualityControllerProps {
  readonly isQualityReduced: boolean;
}

function QualityController({ isQualityReduced }: QualityControllerProps): null {
  const { gl } = useThree();

  useEffect(() => {
    if (isQualityReduced) {
      gl.setPixelRatio(1.0);
    } else {
      gl.setPixelRatio(typeof window !== "undefined" ? window.devicePixelRatio : 1);
    }
  }, [gl, isQualityReduced]);

  return null;
}

// ---------------------------------------------------------------------------
// Scene sub-components
// ---------------------------------------------------------------------------

interface BoardBackgroundProps {
  readonly receiveShadow: boolean;
}

function BoardBackground({ receiveShadow }: BoardBackgroundProps): React.ReactElement {
  return (
    <mesh
      position={[0, -0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={[BOARD_SIZE, BOARD_SIZE]} />
      <meshStandardMaterial color="#bbada0" roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Main export — the default export is required for React.lazy
// ---------------------------------------------------------------------------

export default function Board3D({
  grid,
  isQualityReduced = false,
  animationsEnabled = true,
}: Board3DProps): React.ReactElement {
  const activeTiles: React.ReactElement[] = [];
  grid.eachCell((_x, _y, tile) => {
    if (tile !== null) {
      activeTiles.push(
        <Tile3D
          key={`${String(tile.x)}-${String(tile.y)}`}
          tile={tile}
          animationsEnabled={animationsEnabled}
        />,
      );
    }
  });

  // When quality is reduced, disable shadows entirely
  const shadowsEnabled = !isQualityReduced;

  return (
    <div
      role="img"
      aria-label="3D game board"
      data-testid="board-3d"
      style={{ width: "100%", height: "360px" }}
    >
      <Canvas
        aria-hidden="true"
        shadows={shadowsEnabled}
        camera={{ position: CAMERA_POSITION, fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: !isQualityReduced }}
      >
        {/* Adjusts pixel ratio at the renderer level */}
        <QualityController isQualityReduced={isQualityReduced} />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.9}
          castShadow={shadowsEnabled}
          shadow-mapSize-width={shadowsEnabled ? 1024 : 512}
          shadow-mapSize-height={shadowsEnabled ? 1024 : 512}
        />

        {/* Board surface */}
        <BoardBackground receiveShadow={shadowsEnabled} />

        {/* Tiles */}
        {activeTiles}
      </Canvas>
    </div>
  );
}
