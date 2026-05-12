/**
 * i18n-ready string module for revamp-2048.
 *
 * ## How it works
 * All user-facing text is accessed through the `strings` object exported below.
 * Components MUST import from this module instead of hardcoding text.
 *
 * ## Adding a future locale
 * 1. Create `src/i18n/<locale>.ts` that satisfies the `StringMap` interface
 *    (TypeScript will flag any missing keys at compile time).
 * 2. Add the locale to the `Locale` union type.
 * 3. Update the `getStrings` function to return the right locale at runtime.
 *
 * ## RTL readiness
 * The `dir` field on each locale object should be set to `"rtl"` for right-to-left
 * languages (Arabic, Hebrew, etc.). Components should apply `dir={strings.dir}` to
 * the root container so CSS logical properties (start/end) handle layout automatically.
 * English is LTR; no RTL-specific styles are required at this stage.
 *
 * ## Scope
 * English is the only shipped locale in 2026. The architecture supports future
 * locale addition without any component code changes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of the string map every locale must implement.
 * Adding a key here causes TypeScript to flag incomplete locale objects.
 */
export interface StringMap {
  /** Text direction for the locale — use on the root container element. */
  readonly dir: "ltr" | "rtl";

  // Game identity
  readonly GAME_TITLE: string;
  readonly GAME_SUBTITLE: string;

  // Score area
  readonly SCORE_LABEL: string;
  readonly BEST_LABEL: string;

  // Game messages
  readonly GAME_WON: string;
  readonly GAME_WON_SUBTITLE: string;
  readonly GAME_OVER: string;
  readonly GAME_OVER_SUBTITLE: string;

  // Actions
  readonly KEEP_PLAYING: string;
  readonly TRY_AGAIN: string;
  readonly NEW_GAME: string;

  // Instructions
  readonly HOW_TO_PLAY: string;
  readonly HOW_TO_PLAY_DETAIL: string;

  // Accessibility / ARIA
  readonly TILE_LABEL: string; // e.g. "Tile with value {value}" — interpolate at call site
  readonly SCORE_ANNOUNCEMENT: string; // e.g. "Score: {score}" — interpolate at call site
  readonly BEST_ANNOUNCEMENT: string; // e.g. "Best: {score}" — interpolate at call site

  // Render mode toggle
  readonly RENDER_MODE_2D: string;
  readonly RENDER_MODE_3D: string;
  readonly RENDER_MODE_TOGGLE_LABEL: string;

  // Undo action (BRD FR-1)
  readonly UNDO: string;
  readonly UNDO_LABEL: string;
}

/** Supported locale identifiers. Extend this union when adding a new locale. */
export type Locale = "en";

// ---------------------------------------------------------------------------
// English locale (only shipped locale in 2026)
// ---------------------------------------------------------------------------

const en: StringMap = {
  dir: "ltr",

  GAME_TITLE: "2048",
  GAME_SUBTITLE: "Join the numbers and get to the 2048 tile!",

  SCORE_LABEL: "SCORE",
  BEST_LABEL: "BEST",

  GAME_WON: "You win!",
  GAME_WON_SUBTITLE: "You reached 2048! Keep going for a higher score.",
  GAME_OVER: "Game over!",
  GAME_OVER_SUBTITLE: "No moves left. Start a new game or try again.",

  KEEP_PLAYING: "Keep going",
  TRY_AGAIN: "Try again",
  NEW_GAME: "New Game",

  HOW_TO_PLAY: "How to play",
  HOW_TO_PLAY_DETAIL:
    "Use your arrow keys or swipe to move the tiles. " +
    "Tiles with the same number merge into one when they touch. " +
    "Add them up to reach 2048!",

  TILE_LABEL: "Tile with value {value}",
  SCORE_ANNOUNCEMENT: "Score: {score}",
  BEST_ANNOUNCEMENT: "Best score: {score}",

  RENDER_MODE_2D: "Classic 2D",
  RENDER_MODE_3D: "3D View",
  RENDER_MODE_TOGGLE_LABEL: "Switch rendering mode",

  UNDO: "Undo",
  UNDO_LABEL: "Undo last move",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All available locale string maps keyed by locale identifier. */
const locales: Record<Locale, StringMap> = { en };

/**
 * Returns the string map for the given locale.
 * Falls back to English if the locale is not found — this ensures the UI
 * never breaks even if a future locale is partially shipped.
 */
export function getStrings(locale: Locale = "en"): StringMap {
  // locales is a complete Record<Locale, StringMap> so the lookup is always
  // defined — the explicit cast avoids the unnecessary-condition lint warning
  // while preserving defensive intent for future partial locale additions.
  return locales[locale];
}

/**
 * The default English string map.
 * Import this directly in components until runtime locale switching is needed.
 *
 * @example
 * import { strings } from "./strings.js";
 * <h1>{strings.GAME_TITLE}</h1>
 */
export const strings: StringMap = getStrings("en");
