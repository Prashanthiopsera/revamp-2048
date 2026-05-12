/**
 * GameApp — the game orchestrator component.
 *
 * Responsibilities:
 * - Wire together useGameEngine and useInputHandler hooks.
 * - Render the semantic HTML skeleton that matches the legacy index.html layout:
 *   heading → score area → game container → explanation text.
 * - Orchestrate performance monitoring in 3D mode (WO-026):
 *   - When in 3D mode, `Board3DWithPerformance` is rendered. It owns quality
 *     state and monitoring. When mode switches back to 3D, the component
 *     remounts (because it's conditionally rendered), resetting all quality
 *     state automatically — no setState-in-effect required.
 *   - Auto-fallback to 2D is routed through `handleFallbackTo2D`, which calls
 *     `toggleMode()` from the render mode context.
 * - Respect `prefers-reduced-motion`: disables 3D tile animations.
 */
import { useState, useCallback } from "react";
import { useGameEngine } from "./hooks/useGameEngine.js";
import { useInputHandler } from "./hooks/useInputHandler.js";
import { usePerformanceMonitor } from "./hooks/usePerformanceMonitor.js";
import { useRenderMode } from "./RenderModeContext.js";
import { prefersReducedMotion } from "./capabilities.js";
import { strings } from "./strings.js";
import { Board } from "./components/Board.js";
import { Board3DLazy } from "./components/Board3DLazy.js";
import { PerformanceToast } from "./components/PerformanceToast.js";
import { ScoreBoard } from "./components/ScoreBoard.js";
import { GameMessage } from "./components/GameMessage.js";
import { Controls } from "./components/Controls.js";
import type { Grid } from "./engine/grid.js";

// ---------------------------------------------------------------------------
// Board3DWithPerformance — owns quality state for the current 3D session
//
// This component is only mounted while mode === "3d". When the user switches
// to 2D and back to 3D, it remounts fresh — automatically resetting all
// quality state without needing to call setState inside a useEffect.
// ---------------------------------------------------------------------------

interface Board3DWithPerformanceProps {
  readonly grid: Grid;
  readonly animationsEnabled: boolean;
  /** Triggered when FPS is too low even after quality reduction. */
  readonly onFallbackTo2D: () => void;
}

function Board3DWithPerformance({
  grid,
  animationsEnabled,
  onFallbackTo2D,
}: Board3DWithPerformanceProps): React.ReactElement {
  const [isQualityReduced, setIsQualityReduced] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleQualityReduction = useCallback(() => {
    setIsQualityReduced(true);
    setToastMessage("Reducing quality to improve performance…");
  }, []);

  const handleFallback = useCallback(() => {
    setToastMessage("Switched to 2D mode — performance was too low for 3D.");
    onFallbackTo2D();
  }, [onFallbackTo2D]);

  const handleDismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  usePerformanceMonitor({
    enabled: true, // Component only mounts in 3D mode
    onQualityReduction: handleQualityReduction,
    onFallback: handleFallback,
  });

  return (
    <>
      <PerformanceToast message={toastMessage} onDismiss={handleDismissToast} />
      <Board3DLazy
        grid={grid}
        isQualityReduced={isQualityReduced}
        animationsEnabled={animationsEnabled}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// GameApp
// ---------------------------------------------------------------------------

export function GameApp(): React.ReactElement {
  const { state, dispatch, score, bestScore, isGameTerminated, canContinue, canUndo } = useGameEngine();
  const { mode, toggleMode } = useRenderMode();
  const is3D = mode === "3d";

  // Attach keyboard + touch input to window. isGameTerminated suppresses MOVE
  // but still allows RESTART (the R key and button always work).
  useInputHandler(dispatch, isGameTerminated);

  const handleFallbackTo2D = useCallback(() => {
    if (is3D) {
      toggleMode();
    }
  }, [is3D, toggleMode]);

  // prefers-reduced-motion: skip 3D animations when the user prefers no motion.
  // This is a stable media query value for the lifetime of the page.
  const animationsEnabled = !prefersReducedMotion();

  // Show a reduced-motion notice when in 3D mode — rendered via PerformanceToast
  const reducedMotionMessage =
    is3D && !animationsEnabled
      ? "Animations disabled (prefers-reduced-motion). Consider switching to 2D."
      : null;

  return (
    <div className="container" dir={strings.dir}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="header">
        <h1 className="title">{strings.GAME_TITLE}</h1>

        <ScoreBoard score={score} bestScore={bestScore} />

        <div className="above-game">
          <p className="game-intro">{strings.GAME_SUBTITLE}</p>
          <Controls dispatch={dispatch} canUndo={canUndo} />
        </div>
      </header>

      {/* ── Game area ───────────────────────────────────────────── */}
      <main
        className="game-container"
        aria-label="2048 game board"
        style={{ position: "relative" }}
      >
        {/* Assertive live region for screen reader win/loss announcements.
            Visually hidden but announced immediately by assistive technology
            when the game enters a terminal state. */}
        <div
          aria-live="assertive"
          aria-atomic="true"
          aria-relevant="text"
          data-testid="game-state-announcer"
          className="visually-hidden"
        >
          {isGameTerminated ? (state.won ? strings.GAME_WON : strings.GAME_OVER) : ""}
        </div>

        {/* Win / loss overlay */}
        {isGameTerminated && (
          <GameMessage
            isWon={state.won}
            canContinue={canContinue}
            dispatch={dispatch}
          />
        )}

        {/* Board — 2D flat grid or 3D canvas, swapped by render mode */}
        <div data-render-mode={mode}>
          {is3D ? (
            <>
              {/* reduced-motion notice (outside Board3DWithPerformance so it's
                  always shown without the toast's auto-dismiss timer) */}
              {reducedMotionMessage !== null && (
                <PerformanceToast
                  message={reducedMotionMessage}
                  onDismiss={() => undefined}
                />
              )}
              <Board3DWithPerformance
                grid={state.grid}
                animationsEnabled={animationsEnabled}
                onFallbackTo2D={handleFallbackTo2D}
              />
            </>
          ) : (
            <Board grid={state.grid} />
          )}
        </div>
      </main>

      {/* ── How-to-play explanation ──────────────────────────────── */}
      <footer className="game-explanation" aria-label="How to play">
        <p>
          <strong>{strings.HOW_TO_PLAY}: </strong>
          {strings.HOW_TO_PLAY_DETAIL}
        </p>
      </footer>
    </div>
  );
}
