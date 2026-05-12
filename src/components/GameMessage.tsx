/**
 * GameMessage — semi-transparent overlay shown when the game is won or lost.
 *
 * ## Accessibility
 * - `role="dialog"` + `aria-modal="true"` + `aria-label` identify the overlay
 *   as a modal dialog to assistive technologies.
 * - Focus is moved to the overlay `<div>` on mount via `useEffect` so keyboard
 *   users land inside the overlay immediately and can reach the buttons.
 * - Buttons are semantic `<button>` elements (not `<a>` tags).
 *
 * ## Animation
 * The component mounts/unmounts via conditional rendering in the parent.
 * The CSS `game-message` class carries the fade-in animation that matches
 * the legacy game's `.game-message.game-won` / `.game-message.game-over` styles.
 * An additional `game-won` or `game-over` class is applied so the existing
 * CSS gradient and colour overrides continue to work.
 *
 * ## Props
 * The component is intentionally a dumb presentational component — it receives
 * all state and dispatch as props so it is easily testable and reusable.
 */
import { useRef, useEffect } from "react";
import { strings } from "../strings.js";
import type { GameAction } from "../engine/reducer.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GameMessageProps {
  /** True when the player has reached the win tile (2048). */
  readonly isWon: boolean;
  /**
   * True when the player can choose to continue after winning.
   * If false (already continuing OR game over), the "Keep going" button
   * is not rendered.
   */
  readonly canContinue: boolean;
  /** Reducer dispatch — used by the action buttons. */
  readonly dispatch: React.Dispatch<GameAction>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders the win/loss overlay. Call-site: only mount when the game is terminated.
 */
export function GameMessage({ isWon, canContinue, dispatch }: GameMessageProps): React.ReactElement {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Move focus to the overlay when it appears so keyboard users don't get stranded
  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  const title = isWon ? strings.GAME_WON : strings.GAME_OVER;
  const subtitle = isWon ? strings.GAME_WON_SUBTITLE : strings.GAME_OVER_SUBTITLE;
  const overlayClass = ["game-message", isWon ? "game-won" : "game-over"].join(" ");

  return (
    <div
      ref={overlayRef}
      className={overlayClass}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
    >
      <p className="game-message-title">{title}</p>
      <p className="game-message-subtitle">{subtitle}</p>

      <div className="game-message-actions">
        {isWon && canContinue && (
          <button
            type="button"
            className="keep-playing-button"
            onClick={() => { dispatch({ type: "CONTINUE_AFTER_WIN" }); }}
          >
            {strings.KEEP_PLAYING}
          </button>
        )}

        <button
          type="button"
          className="retry-button"
          onClick={() => { dispatch({ type: "RESTART" }); }}
        >
          {strings.TRY_AGAIN}
        </button>
      </div>
    </div>
  );
}
