/**
 * Controls — renders the game action buttons and the 2D/3D rendering toggle.
 *
 * ## Contents
 * - "New Game" restart button (always enabled).
 * - 2D/3D toggle switch that reads/writes RenderModeContext.
 *   Disabled when WebGL is unavailable (detected by `hasWebGL()` from
 *   capabilities.ts), with a `title` tooltip explaining why.
 *
 * ## Accessibility
 * - All interactive elements are semantic `<button>` elements.
 * - `aria-label` is set on the toggle to describe what it does, not just what
 *   mode it switches to.
 * - `aria-pressed` on the toggle reflects current state (true = 3D active).
 * - Minimum 44px touch target is enforced via the `control-button` CSS class.
 * - The disabled state is communicated to assistive tech via `aria-disabled` and
 *   `disabled` attributes on the button, plus a `title` tooltip with reason.
 */
import { useRenderMode } from "../RenderModeContext.js";
import { hasWebGL } from "../capabilities.js";
import { strings } from "../strings.js";
import type { GameAction } from "../engine/reducer.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ControlsProps {
  /** Reducer dispatch from useGameEngine — used by the restart and undo buttons. */
  readonly dispatch: React.Dispatch<GameAction>;
  /**
   * True when an undo snapshot is available and the game is in progress.
   * Defaults to `false` (button disabled) when not provided.
   */
  readonly canUndo?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBGL_UNAVAILABLE_TOOLTIP =
  "3D mode requires WebGL, which is not available in this browser.";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Controls({ dispatch, canUndo = false }: ControlsProps): React.ReactElement {
  const { mode, toggleMode } = useRenderMode();
  const webGlAvailable = hasWebGL();

  const is3D = mode === "3d";
  const toggleDisabled = !webGlAvailable && !is3D;

  return (
    <div className="game-controls" role="group" aria-label="Game controls">
      {/* New Game button */}
      <button
        type="button"
        className="control-button restart-button"
        onClick={() => { dispatch({ type: "RESTART" }); }}
      >
        {strings.NEW_GAME}
      </button>

      {/* Undo last move button (BRD FR-1) */}
      <button
        type="button"
        className="control-button undo-button"
        onClick={() => { dispatch({ type: "UNDO" }); }}
        aria-label={strings.UNDO_LABEL}
        disabled={!canUndo}
        aria-disabled={!canUndo}
      >
        {strings.UNDO}
      </button>

      {/* 2D/3D render mode toggle */}
      <button
        type="button"
        className="control-button render-toggle-button"
        onClick={toggleMode}
        aria-label={strings.RENDER_MODE_TOGGLE_LABEL}
        aria-pressed={is3D}
        disabled={toggleDisabled}
        aria-disabled={toggleDisabled}
        title={toggleDisabled ? WEBGL_UNAVAILABLE_TOOLTIP : undefined}
      >
        {is3D ? strings.RENDER_MODE_2D : strings.RENDER_MODE_3D}
      </button>
    </div>
  );
}
