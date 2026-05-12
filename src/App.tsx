/**
 * App — the outermost React component.
 *
 * Responsibilities:
 * - Provide global context to the component tree (RenderModeProvider).
 * - Render the GameApp orchestrator.
 *
 * This component is intentionally thin. All game state lives in GameApp and
 * its children. Global providers (theme, i18n, error boundary, analytics) are
 * added here so they wrap the entire tree.
 */
import { RenderModeProvider } from "./RenderModeContext.js";
import { GameApp } from "./GameApp.js";

export function App(): React.ReactElement {
  return (
    <RenderModeProvider>
      <GameApp />
    </RenderModeProvider>
  );
}
