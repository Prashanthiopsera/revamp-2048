/**
 * Tests for useInputHandler (WO-016).
 *
 * Tests the hook in a JSDOM environment. We dispatch synthetic events on `window`
 * and assert on the vi.fn() dispatch stub.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useInputHandler,
  resolveSwipeDirection,
  SWIPE_THRESHOLD_PX,
  ANIMATION_INPUT_LOCK_MS,
} from "./useInputHandler.js";
import type { GameAction } from "../engine/reducer.js";

// ---------------------------------------------------------------------------
// JSDOM polyfills
// ---------------------------------------------------------------------------

// JSDOM does not implement the Touch constructor. We define a minimal polyfill
// so touch-event tests can construct Touch objects and dispatch TouchEvents.
if (typeof Touch === "undefined") {
  class TouchPolyfill {
    readonly identifier: number;
    readonly target: EventTarget;
    readonly clientX: number;
    readonly clientY: number;
    constructor(init: { identifier: number; target: EventTarget; clientX: number; clientY: number }) {
      this.identifier = init.identifier;
      this.target = init.target;
      this.clientX = init.clientX;
      this.clientY = init.clientY;
    }
  }
  (globalThis as Record<string, unknown>).Touch = TouchPolyfill;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDispatch(): ReturnType<typeof vi.fn<(action: GameAction) => void>> {
  return vi.fn<(action: GameAction) => void>();
}

/** Fires a synthetic keydown event on window. */
function fireKey(key: string, modifiers: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...modifiers }));
}

/** Fires touchstart then touchend to simulate a swipe. */
function fireSwipe(dx: number, dy: number): void {
  const startX = 100;
  const startY = 100;
  window.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [new Touch({ identifier: 1, target: document.body, clientX: startX, clientY: startY })],
    }),
  );
  window.dispatchEvent(
    new TouchEvent("touchend", {
      changedTouches: [
        new Touch({ identifier: 1, target: document.body, clientX: startX + dx, clientY: startY + dy }),
      ],
    }),
  );
}

// ---------------------------------------------------------------------------
// resolveSwipeDirection unit tests (pure function — no hook needed)
// ---------------------------------------------------------------------------

describe("resolveSwipeDirection()", () => {
  it("returns null when displacement is below threshold", () => {
    expect(resolveSwipeDirection(0, 0)).toBeNull();
    expect(resolveSwipeDirection(5, 3)).toBeNull();
  });

  it("resolves rightward swipe", () => {
    expect(resolveSwipeDirection(50, 0)).toBe("right");
    expect(resolveSwipeDirection(50, 10)).toBe("right");
  });

  it("resolves leftward swipe", () => {
    expect(resolveSwipeDirection(-50, 0)).toBe("left");
  });

  it("resolves downward swipe", () => {
    expect(resolveSwipeDirection(0, 50)).toBe("down");
    expect(resolveSwipeDirection(10, 50)).toBe("down");
  });

  it("resolves upward swipe", () => {
    expect(resolveSwipeDirection(0, -50)).toBe("up");
  });

  it("respects custom threshold", () => {
    expect(resolveSwipeDirection(15, 0, 20)).toBeNull();
    expect(resolveSwipeDirection(25, 0, 20)).toBe("right");
  });

  it("prefers horizontal when |dx| === |dy|", () => {
    expect(resolveSwipeDirection(30, 30)).toBe("right");
    expect(resolveSwipeDirection(-30, -30)).toBe("left");
  });
});

// ---------------------------------------------------------------------------
// useInputHandler — keyboard tests
// ---------------------------------------------------------------------------

describe("useInputHandler — keyboard", () => {
  let dispatch: ReturnType<typeof makeDispatch>;

  beforeEach(() => {
    dispatch = makeDispatch();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches MOVE left for ArrowLeft", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("ArrowLeft");
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "left" });
  });

  it("dispatches MOVE right for ArrowRight", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("ArrowRight");
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "right" });
  });

  it("dispatches MOVE up for ArrowUp", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("ArrowUp");
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "up" });
  });

  it("dispatches MOVE down for ArrowDown", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("ArrowDown");
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "down" });
  });

  it("dispatches MOVE for WASD keys", () => {
    renderHook(() => { useInputHandler(dispatch, false, { lockMs: 0 }); });
    fireKey("w"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "up" });
    fireKey("s"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "down" });
    fireKey("a"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "left" });
    fireKey("d"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "right" });
  });

  it("dispatches MOVE for Vim HJKL keys", () => {
    renderHook(() => { useInputHandler(dispatch, false, { lockMs: 0 }); });
    fireKey("h"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "left" });
    fireKey("j"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "down" });
    fireKey("k"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "up" });
    fireKey("l"); expect(dispatch).toHaveBeenLastCalledWith({ type: "MOVE", direction: "right" });
  });

  it("dispatches RESTART for 'r' key", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("r");
    expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
  });

  it("dispatches RESTART for 'R' key", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("R");
    expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
  });

  it("suppresses MOVE when modifier keys are held", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireKey("ArrowLeft", { altKey: true });
    fireKey("ArrowLeft", { ctrlKey: true });
    fireKey("ArrowLeft", { metaKey: true });
    fireKey("ArrowLeft", { shiftKey: true });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("suppresses MOVE when isTerminated is true", () => {
    renderHook(() => { useInputHandler(dispatch, true); });
    fireKey("ArrowLeft");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("still dispatches RESTART when isTerminated is true", () => {
    renderHook(() => { useInputHandler(dispatch, true); });
    fireKey("r");
    expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
  });

  it("applies animation lock preventing rapid duplicate dispatches", () => {
    vi.useFakeTimers();
    renderHook(() => { useInputHandler(dispatch, false, { lockMs: 150 }); });

    fireKey("ArrowLeft"); // dispatched + locked
    fireKey("ArrowLeft"); // suppressed (locked)
    expect(dispatch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200); // lock expired
    fireKey("ArrowLeft"); // should now dispatch
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = renderHook(() => { useInputHandler(dispatch, false); });
    unmount();
    fireKey("ArrowLeft");
    expect(dispatch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useInputHandler — touch/swipe tests
// ---------------------------------------------------------------------------

describe("useInputHandler — touch/swipe", () => {
  let dispatch: ReturnType<typeof makeDispatch>;

  beforeEach(() => {
    dispatch = makeDispatch();
  });

  it("dispatches MOVE right for rightward swipe", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireSwipe(SWIPE_THRESHOLD_PX + 10, 0);
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "right" });
  });

  it("dispatches MOVE left for leftward swipe", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireSwipe(-(SWIPE_THRESHOLD_PX + 10), 0);
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "left" });
  });

  it("dispatches MOVE down for downward swipe", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireSwipe(0, SWIPE_THRESHOLD_PX + 10);
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "down" });
  });

  it("dispatches MOVE up for upward swipe", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireSwipe(0, -(SWIPE_THRESHOLD_PX + 10));
    expect(dispatch).toHaveBeenCalledWith({ type: "MOVE", direction: "up" });
  });

  it("ignores swipes shorter than threshold", () => {
    renderHook(() => { useInputHandler(dispatch, false); });
    fireSwipe(5, 3);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("suppresses swipe MOVE when isTerminated is true", () => {
    renderHook(() => { useInputHandler(dispatch, true); });
    fireSwipe(SWIPE_THRESHOLD_PX + 10, 0);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

describe("exported constants", () => {
  it("ANIMATION_INPUT_LOCK_MS is a positive number", () => {
    expect(ANIMATION_INPUT_LOCK_MS).toBeGreaterThan(0);
  });

  it("SWIPE_THRESHOLD_PX is a positive number", () => {
    expect(SWIPE_THRESHOLD_PX).toBeGreaterThan(0);
  });
});
