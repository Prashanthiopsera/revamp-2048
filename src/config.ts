/**
 * Centralized game configuration for revamp-2048.
 *
 * All tunable game constants live here. No magic numbers should appear in engine
 * or UI code — import from this module instead. This file acts as living
 * documentation for every knob in the system.
 */

// ---------------------------------------------------------------------------
// Render mode
// ---------------------------------------------------------------------------

/** The two supported rendering modes. 2D is the classic CSS tile view; 3D uses
 *  React Three Fiber for an immersive tile presentation. */
export type RenderMode = "2d" | "3d";

/** Default rendering mode shown on first load. 2D is chosen because it works on
 *  all devices without WebGL and matches the original game's visual identity. */
export const DEFAULT_RENDER_MODE: RenderMode = "2d";

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/** Number of rows and columns in the game grid.
 *  Valid range: 2–8. Changing this requires a fresh game state. */
export const GRID_SIZE = 4;

// ---------------------------------------------------------------------------
// Gameplay
// ---------------------------------------------------------------------------

/** Score value on the tile that triggers the win condition.
 *  The classic 2048 rules win at 2048. Valid range: any power of 2 ≥ 4. */
export const WIN_VALUE = 2048;

/** Probability that a newly spawned tile has value 2 (vs. 4).
 *  The complementary probability (1 − this) gives the chance of spawning a 4.
 *  Classic rules: 0.9. Valid range: 0.0–1.0. */
export const SPAWN_PROBABILITY_OF_TWO = 0.9;

/** Number of tiles placed on the board at the start of a new game.
 *  Classic rules: 2. Valid range: 1–(GRID_SIZE² − 1). */
export const STARTING_TILE_COUNT = 2;

// ---------------------------------------------------------------------------
// Animation durations (milliseconds)
// ---------------------------------------------------------------------------

/** Duration of the slide/merge animation when tiles move across the grid.
 *  Matches the original game's 100 ms CSS transition. */
export const ANIMATION_DURATION_SLIDE = 100;

/** Duration of the appear animation for a newly spawned tile.
 *  Matches the original game's 200 ms CSS animation. */
export const ANIMATION_DURATION_APPEAR = 200;

/** Duration of the "pop" scale animation when two tiles merge.
 *  Matches the original game's 200 ms CSS animation. */
export const ANIMATION_DURATION_POP = 200;

// ---------------------------------------------------------------------------
// Performance thresholds (3D mode)
// ---------------------------------------------------------------------------

/** Frames-per-second threshold below which the 3D renderer reduces visual quality
 *  (e.g., pixel ratio, shadow quality) before considering a 2D fallback.
 *  PRD requirement: quality reduction triggers first at this level. */
export const FPS_QUALITY_REDUCTION_THRESHOLD = 55;

/** Frames-per-second threshold below which the app prompts or auto-falls back
 *  from 3D to 2D mode. Only reached if quality reduction did not recover FPS. */
export const FPS_FALLBACK_THRESHOLD = 45;

/** Number of consecutive seconds FPS must stay below FPS_QUALITY_REDUCTION_THRESHOLD
 *  before quality reduction is triggered. Prevents flicker on brief dips. */
export const FPS_QUALITY_WINDOW_SECONDS = 3;

/** Number of consecutive seconds FPS must stay below FPS_FALLBACK_THRESHOLD
 *  before the 2D fallback is triggered. */
export const FPS_FALLBACK_WINDOW_SECONDS = 5;
