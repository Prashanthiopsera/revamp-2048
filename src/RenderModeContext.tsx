/* eslint-disable react-refresh/only-export-components */
// Context files intentionally mix component (Provider) and non-component
// (hook, context object) exports. Fast Refresh handles this by re-mounting
// the Provider when the file changes. Suppressing the rule file-wide is the
// established pattern for React context modules.
/**
 * RenderModeContext — provides the current 2D/3D render mode and a toggle to
 * switch between them, persisting the selection to the storage adapter so the
 * user's choice survives page reloads.
 *
 * Consumers that need the render mode import `useRenderMode()`.
 * Components that only pass mode down to children should use `RenderModeContext`
 * directly to avoid re-rendering when unrelated context values change.
 *
 * ## Default
 * The mode defaults to `"2d"` (from `DEFAULT_RENDER_MODE` in config.ts).
 * `"2d"` is chosen because it works on all devices without WebGL and matches
 * the original game's visual identity.
 */
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { DEFAULT_RENDER_MODE } from "./config.js";
import { storage } from "./storage.js";
import type { RenderMode } from "./config.js";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface RenderModeContextValue {
  /** The currently active render mode. */
  readonly mode: RenderMode;
  /** Toggle between "2d" and "3d". Persists the new value to storage. */
  readonly toggleMode: () => void;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------

/**
 * The context object itself. Use `useRenderMode()` instead of consuming this
 * directly — the hook throws a descriptive error when used outside the provider.
 */
export const RenderModeContext = createContext<RenderModeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface RenderModeProviderProps {
  readonly children: ReactNode;
}

/**
 * Reads the initial render mode from storage (falling back to DEFAULT_RENDER_MODE)
 * and provides it to the subtree.
 */
export function RenderModeProvider({ children }: RenderModeProviderProps): React.ReactElement {
  const [mode, setMode] = useState<RenderMode>(() => {
    const saved = storage.getUserPreference()?.renderMode;
    if (saved === "2d" || saved === "3d") return saved;
    return DEFAULT_RENDER_MODE;
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next: RenderMode = prev === "2d" ? "3d" : "2d";
      storage.setUserPreference({ renderMode: next });
      return next;
    });
  }, []);

  return (
    <RenderModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </RenderModeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Returns the current render mode and toggle function.
 *
 * @throws {Error} When called outside of a `<RenderModeProvider>`.
 */
export function useRenderMode(): RenderModeContextValue {
  const ctx = useContext(RenderModeContext);
  if (ctx === null) {
    throw new Error(
      "useRenderMode() must be used inside <RenderModeProvider>. " +
        "Make sure the component tree includes <App> at the root.",
    );
  }
  return ctx;
}
