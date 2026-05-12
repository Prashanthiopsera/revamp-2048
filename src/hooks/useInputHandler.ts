/**
 * useInputHandler — normalises browser input events into typed GameAction dispatches.
 *
 * Handles:
 * - Keyboard: Arrow keys, WASD, Vim keys (HJKL), and R for restart.
 * - Touch/pointer: Swipe gestures calculated from start/end touch coordinates.
 *
 * Out of scope: button click handlers (those are in component props).
 *
 * ## Animation lock (REQ-017)
 * A configurable lock window prevents rapid duplicate dispatches that could
 * corrupt board state during tile animations. The window defaults to
 * ANIMATION_INPUT_LOCK_MS from config.ts.
 *
 * ## Modifier key filtering
 * Alt, Ctrl, Meta, and Shift suppress keyboard input to avoid hijacking browser
 * shortcuts (e.g., Ctrl+R for reload, Alt+Left for browser back).
 *
 * ## Design note — stable event handler ref pattern
 * The effect includes `dispatch`, `isTerminated`, and `lockMs` in its deps so
 * stale closures are never an issue. Because `dispatch` from useReducer is
 * referentially stable and `isTerminated` only changes on game state transitions,
 * the listener re-registration cost is negligible.
 * The `lockedUntilRef` is a ref that is only ever written inside event handlers
 * (never during render), so it does not violate the react-hooks/refs rule.
 */
import { useEffect, useRef } from "react";
import { ANIMATION_DURATION_SLIDE } from "../config.js";
import type { GameAction } from "../engine/reducer.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A move direction as interpreted from keyboard or swipe input. */
export type InputDirection = "up" | "down" | "left" | "right";

/**
 * Duration (ms) the input handler stays locked after a dispatched move.
 * Set to the slide animation duration so the board isn't updated mid-animation.
 */
export const ANIMATION_INPUT_LOCK_MS = ANIMATION_DURATION_SLIDE;

/** Minimum swipe distance in pixels required to register a swipe gesture. */
export const SWIPE_THRESHOLD_PX = 20;

// ---------------------------------------------------------------------------
// Key → direction / action mappings
// ---------------------------------------------------------------------------

const DIRECTION_KEYS: Readonly<Partial<Record<string, InputDirection>>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  // WASD
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  // Vim keys
  k: "up",
  j: "down",
  h: "left",
  l: "right",
};

const RESTART_KEYS = new Set(["r", "R"]);

// ---------------------------------------------------------------------------
// Swipe helpers
// ---------------------------------------------------------------------------

/**
 * Determines swipe direction from the displacement vector (dx, dy).
 * Returns null when the swipe is too short to be intentional.
 */
export function resolveSwipeDirection(
  dx: number,
  dy: number,
  threshold: number = SWIPE_THRESHOLD_PX,
): InputDirection | null {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < threshold && absDy < threshold) return null;

  if (absDx >= absDy) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Optional configuration for `useInputHandler`.
 *
 * @example
 * useInputHandler(dispatch, isTerminated, { lockMs: 150 });
 */
export interface UseInputHandlerOptions {
  /** Milliseconds to suppress input after a dispatch. Defaults to ANIMATION_INPUT_LOCK_MS. */
  readonly lockMs?: number;
}

/**
 * Attaches keyboard and touch listeners to `window`, translating events into
 * `GameAction` dispatches. Cleans up all listeners on unmount.
 *
 * @param dispatch - The reducer dispatch from useGameEngine.
 * @param isTerminated - When true, MOVE actions are suppressed (game over / win screen).
 *                       RESTART is still allowed so the player can start a new game.
 * @param options - Optional configuration (lock window duration).
 */
export function useInputHandler(
  dispatch: React.Dispatch<GameAction>,
  isTerminated: boolean,
  options: UseInputHandlerOptions = {},
): void {
  const lockMs = options.lockMs ?? ANIMATION_INPUT_LOCK_MS;

  // Written only inside event handlers — never during render.
  const lockedUntilRef = useRef<number>(0);

  // Touch state spans two events (touchstart + touchend) — a ref avoids
  // forcing a re-render between them.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function isLocked(): boolean {
      return Date.now() < lockedUntilRef.current;
    }

    function lock(): void {
      lockedUntilRef.current = Date.now() + lockMs;
    }

    function dispatchMove(direction: InputDirection): void {
      if (isLocked()) return;
      if (isTerminated) return;
      lock();
      dispatch({ type: "MOVE", direction });
    }

    function handleKeydown(event: KeyboardEvent): void {
      // Suppress when modifier keys are held — avoids hijacking browser shortcuts
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      const direction = DIRECTION_KEYS[event.key];
      if (direction !== undefined) {
        event.preventDefault(); // prevent arrow keys from scrolling the page
        dispatchMove(direction);
        return;
      }

      if (RESTART_KEYS.has(event.key)) {
        // RESTART is intentionally allowed even when the game is terminated
        dispatch({ type: "RESTART" });
      }
    }

    function handleTouchStart(event: TouchEvent): void {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchEnd(event: TouchEvent): void {
      const start = touchStartRef.current;
      if (start === null) return;
      touchStartRef.current = null;

      if (event.changedTouches.length === 0) return;
      const touch = event.changedTouches[0];

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const direction = resolveSwipeDirection(dx, dy);
      if (direction !== null) {
        dispatchMove(direction);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dispatch, isTerminated, lockMs]);
}
