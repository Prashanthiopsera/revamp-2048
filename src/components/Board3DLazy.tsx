/**
 * Board3DLazy — thin wrapper that lazily imports `Board3D` on first use.
 *
 * React.lazy() defers loading the Three.js bundle (~600 kB) until the user
 * actually switches to 3D mode, improving initial load performance for users
 * who stay in 2D mode.
 *
 * The `Suspense` boundary here renders a simple spinner / loading message
 * while the chunk is being fetched. The fallback intentionally matches the
 * board's height (`360px`) to prevent layout shift.
 */
import { lazy, Suspense } from "react";
import type { Board3DProps } from "./Board3D.js";

const Board3D = lazy(() => import("./Board3D.js"));

function Board3DFallback(): React.ReactElement {
  return (
    <div
      role="status"
      aria-label="Loading 3D board…"
      data-testid="board-3d-loading"
      style={{
        width: "100%",
        height: "360px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#bbada0",
        color: "#f9f6f2",
        fontSize: "1.1rem",
        borderRadius: "4px",
      }}
    >
      Loading 3D…
    </div>
  );
}

export function Board3DLazy(props: Board3DProps): React.ReactElement {
  return (
    <Suspense fallback={<Board3DFallback />}>
      <Board3D {...props} />
    </Suspense>
  );
}
