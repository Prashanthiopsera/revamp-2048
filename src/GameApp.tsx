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
import { Board } from "./components/Board.js";
import { ScoreBoard } from "./components/ScoreBoard.js";
import { GameMessage } from "./components/GameMessage.js";
import { Controls } from "./components/Controls.js";

export function GameApp(): React.ReactElement {
  const { state, dispatch, score, bestScore, isGameTerminated, canContinue } = useGameEngine();
  const { mode } = useRenderMode();

  // Attach keyboard + touch input to window. isGameTerminated suppresses MOVE
  // but still allows RESTART (the R key and button always work).
  useInputHandler(dispatch, isGameTerminated);

  return (
    <div className="container" dir={strings.dir}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="header">
        <h1 className="title">{strings.GAME_TITLE}</h1>

        <ScoreBoard score={score} bestScore={bestScore} />

        <div className="above-game">
          <p className="game-intro">{strings.GAME_SUBTITLE}</p>
          <Controls dispatch={dispatch} />
        </div>
      </header>

      {/* ── Game area ───────────────────────────────────────────── */}
      <main className="game-container" aria-label="2048 game board">
        {/* Win / loss overlay */}
        {isGameTerminated && (
          <GameMessage
            isWon={state.won}
            canContinue={canContinue}
            dispatch={dispatch}
          />
        )}

        {/* Board — renders the 4×4 grid and all active tiles */}
        <div data-render-mode={mode}>
          <Board grid={state.grid} />
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
