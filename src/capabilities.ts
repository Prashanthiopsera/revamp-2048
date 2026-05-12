/**
 * Browser capability detection module for revamp-2048.
 *
 * Each function is a pure query — it reads browser APIs but never modifies
 * state, never throws, and never leaves artifacts (canvas elements, DOM nodes).
 * Results should be cached at the call site if queried frequently.
 *
 * These detections gate 3D mode, localStorage persistence, animation quality,
 * and input handling. See the component work orders (WO-021, WO-026, WO-027)
 * for where each flag is consumed.
 */

// ---------------------------------------------------------------------------
// Individual capability detectors
// ---------------------------------------------------------------------------

/**
 * Returns true if the browser can create a WebGL (or WebGL2) rendering context.
 *
 * A temporary off-screen canvas is created and immediately discarded.
 * The context is lost via `WEBGL_lose_context` if available so that drivers
 * can reclaim GPU resources right away rather than waiting for GC.
 */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx: WebGL2RenderingContext | WebGLRenderingContext | null =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    if (!ctx) return false;

    // Release the context so the GPU can reclaim memory immediately
    const ext = ctx.getExtension("WEBGL_lose_context");
    ext?.loseContext();

    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true if localStorage is available and writable.
 *
 * Mirrors the pattern from the legacy `LocalStorageManager.localStorageSupported()`.
 * Some browsers throw or silently ignore writes in private/incognito mode.
 */
export function hasLocalStorage(): boolean {
  const TEST_KEY = "__2048_ls_probe__";
  try {
    localStorage.setItem(TEST_KEY, "1");
    localStorage.removeItem(TEST_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true if the user has requested reduced motion via the OS accessibility
 * setting. When true, slide and pop animations should be suppressed or shortened.
 *
 * WCAG 2.1 SC 2.3.3 — this is checked before applying CSS transitions.
 */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Returns true if the device supports touch events.
 * Used to decide whether to attach touch swipe handlers in addition to keyboard.
 */
export function hasTouchSupport(): boolean {
  try {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  } catch {
    return false;
  }
}

/**
 * Returns true if the browser supports the Pointer Events API.
 * Pointer events unify mouse, touch, and stylus input; preferred over Touch Events.
 */
export function hasPointerSupport(): boolean {
  try {
    return "PointerEvent" in window;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Composite capabilities object
// ---------------------------------------------------------------------------

/** Typed snapshot of all detected browser capabilities. */
export interface Capabilities {
  /** WebGL rendering context available — required for 3D mode. */
  readonly webgl: boolean;
  /** localStorage is writable — required for score and state persistence. */
  readonly localStorage: boolean;
  /** User prefers reduced motion — animations should be suppressed. */
  readonly reducedMotion: boolean;
  /** Touch events are supported — swipe gesture handler should be attached. */
  readonly touch: boolean;
  /** Pointer Events API is available — preferred over raw touch events. */
  readonly pointer: boolean;
}

/**
 * Queries all browser capabilities and returns a single typed snapshot.
 * Call once at app startup and pass the result down rather than calling
 * individual detectors repeatedly.
 *
 * @example
 * const caps = getCapabilities();
 * if (!caps.webgl) disable3DMode();
 * if (!caps.localStorage) showPersistenceWarning();
 */
export function getCapabilities(): Capabilities {
  return {
    webgl: hasWebGL(),
    localStorage: hasLocalStorage(),
    reducedMotion: prefersReducedMotion(),
    touch: hasTouchSupport(),
    pointer: hasPointerSupport(),
  };
}
