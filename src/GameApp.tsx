/**
 * GameApp — the game orchestrator component.
 *
 * Responsibilities:
 * - Wire together useGameEngine and useInputHandler hooks.
 * - Render the semantic HTML skeleton that matches the legacy index.html layout:
 *   heading → score area → game container → explanation text.
 * - Pass game state and dispatch as props to child placeholder slots.
 *   Real Board, Tile, ScoreBoard, GameMessage, and Controls components are
 *   wired in by WO-018 through WO-021.
 * - Render a render-mode toggle button (supplied by RenderModeContext).
 *
 * ## Placeholder children
 * Until the real child components exist, each slot renders a minimal
 * accessible placeholder so the page is testable and visually meaningful.
 * Replace the placeholder comments with real components as they land.
 */
import { useGameEngine } from "./hooks/useGameEngine.js";
import { useInputHandler } from "./hooks/useInputHandler.js";
import { useRenderMode } from "./RenderModeContext.js";
import { strings } from "./strings.js";

export function GameApp(): React.ReactElement {
  const { state, dispatch, score, bestScore, isGameTerminated, canContinue } = useGameEngine();
  const { mode, toggleMode } = useRenderMode();

  // Attach keyboard + touch input to window. isGameTerminated suppresses MOVE
  // but still allows RESTART (the R key and button always work).
  useInputHandler(dispatch, isGameTerminated);

  return (
    <div className="container" dir={strings.dir}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="header">
        <h1 className="title">{strings.GAME_TITLE}</h1>

        {/* Score boxes — replaced by <ScoreBoard> in WO-019 */}
        <div className="scores-container" role="region" aria-label="Scores">
          <div className="score-container" aria-live="polite" aria-atomic="true">
            <div className="score-label">{strings.SCORE_LABEL}</div>
            <div className="score-value" aria-label={strings.SCORE_ANNOUNCEMENT.replace("{score}", String(score))}>
              {score}
            </div>
          </div>
          <div className="best-container" aria-live="polite" aria-atomic="true">
            <div className="best-label">{strings.BEST_LABEL}</div>
            <div className="best-value" aria-label={strings.BEST_ANNOUNCEMENT.replace("{score}", String(bestScore))}>
              {bestScore}
            </div>
          </div>
        </div>

        {/* Controls — New Game + render mode toggle; replaced by <Controls> in WO-021 */}
        <div className="above-game">
          <p className="game-intro">{strings.GAME_SUBTITLE}</p>
          <div className="game-controls">
            <button
              className="restart-button"
              onClick={() => { dispatch({ type: "RESTART" }); }}
              type="button"
            >
              {strings.NEW_GAME}
            </button>
            <button
              className="render-toggle-button"
              onClick={toggleMode}
              type="button"
              aria-label={strings.RENDER_MODE_TOGGLE_LABEL}
              title={mode === "2d" ? strings.RENDER_MODE_3D : strings.RENDER_MODE_2D}
            >
              {mode === "2d" ? strings.RENDER_MODE_3D : strings.RENDER_MODE_2D}
            </button>
          </div>
        </div>
      </header>

      {/* ── Game area ───────────────────────────────────────────── */}
      <main className="game-container" aria-label="2048 game board">
        {/* Game message overlay — replaced by <GameMessage> in WO-020 */}
        {isGameTerminated && (
          <div className="game-message" role="status" aria-live="assertive">
            {state.won ? (
              <>
                <p className="game-message-title">{strings.GAME_WON}</p>
                <p className="game-message-subtitle">{strings.GAME_WON_SUBTITLE}</p>
                <div className="game-message-actions">
                  {canContinue && (
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
              </>
            ) : (
              <>
                <p className="game-message-title">{strings.GAME_OVER}</p>
                <p className="game-message-subtitle">{strings.GAME_OVER_SUBTITLE}</p>
                <div className="game-message-actions">
                  <button
                    type="button"
                    className="retry-button"
                    onClick={() => { dispatch({ type: "RESTART" }); }}
                  >
                    {strings.TRY_AGAIN}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Board placeholder — replaced by <Board> in WO-018 */}
        <div
          className="grid-container"
          aria-label="Game board"
          data-render-mode={mode}
          data-testid="board-placeholder"
        >
          {/* WO-018: mount <Board state={state} /> here */}
          <div className="grid-row-count" style={{ display: "none" }}>
            {state.grid.size}
          </div>
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
