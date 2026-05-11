/**
 * Tests for the useGameEngine hook (WO-015).
 *
 * Uses @testing-library/react's `renderHook` to test the hook in isolation.
 * The storage adapter is mocked to avoid touching real localStorage.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameEngine } from "./useGameEngine.js";
import { storage } from "../storage.js";

// ---------------------------------------------------------------------------
// Mock storage module so tests don't touch localStorage
// ---------------------------------------------------------------------------

vi.mock("../storage.js", () => {
  const mockStorage = {
    getGameState: vi.fn(() => null),
    setGameState: vi.fn(),
    clearGameState: vi.fn(),
    getBestScore: vi.fn(() => 0),
    setBestScore: vi.fn(),
    getUserPreference: vi.fn(() => null),
    setUserPreference: vi.fn(),
  };
  return { storage: mockStorage };
});

// Convenience alias — avoids @typescript-eslint/unbound-method on vi.mocked(storage.x)
const mockedStorage = vi.mocked(storage);

beforeEach(() => {
  vi.clearAllMocks();
  mockedStorage.getGameState.mockReturnValue(null);
  mockedStorage.getBestScore.mockReturnValue(0);
});

describe("useGameEngine (WO-015)", () => {
  describe("initialization", () => {
    it("starts with score 0 when no saved state", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.score).toBe(0);
    });

    it("starts with bestScore from storage", () => {
      mockedStorage.getBestScore.mockReturnValue(512);
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.bestScore).toBe(512);
    });

    it("game is not terminated on fresh start", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.isGameTerminated).toBe(false);
    });

    it("canContinue is false on fresh start", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.canContinue).toBe(false);
    });

    it("exposes a dispatch function", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(typeof result.current.dispatch).toBe("function");
    });

    it("exposes a state object with a numeric score", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.state).toBeDefined();
      expect(typeof result.current.state.score).toBe("number");
    });
  });

  describe("RESTART action", () => {
    it("resets score to 0", () => {
      const { result } = renderHook(() => useGameEngine());
      act(() => {
        result.current.dispatch({ type: "RESTART" });
      });
      expect(result.current.score).toBe(0);
    });

    it("preserves bestScore across restart", () => {
      mockedStorage.getBestScore.mockReturnValue(256);
      const { result } = renderHook(() => useGameEngine());
      act(() => {
        result.current.dispatch({ type: "RESTART" });
      });
      expect(result.current.bestScore).toBe(256);
    });

    it("game is not terminated after restart", () => {
      const { result } = renderHook(() => useGameEngine());
      act(() => {
        result.current.dispatch({ type: "RESTART" });
      });
      expect(result.current.isGameTerminated).toBe(false);
    });
  });

  describe("persistence", () => {
    it("calls setGameState after state changes", () => {
      const { result } = renderHook(() => useGameEngine());
      act(() => {
        result.current.dispatch({ type: "RESTART" });
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedStorage.setGameState).toHaveBeenCalled();
    });

    it("does not call clearGameState on fresh start", () => {
      renderHook(() => useGameEngine());
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedStorage.clearGameState).not.toHaveBeenCalled();
    });

    it("persists best score on each state change", () => {
      renderHook(() => useGameEngine());
      // setBestScore is called once in the initial effect with the initial best score
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedStorage.setBestScore).toHaveBeenCalledWith(0);
    });
  });

  describe("derived flags", () => {
    it("isGameTerminated is false when game is in progress", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.isGameTerminated).toBe(false);
    });

    it("canContinue is false when game is not won", () => {
      const { result } = renderHook(() => useGameEngine());
      expect(result.current.canContinue).toBe(false);
    });
  });

  describe("CONTINUE_AFTER_WIN action", () => {
    it("does not change state when game is not won", () => {
      const { result } = renderHook(() => useGameEngine());
      const stateBefore = result.current.state;
      act(() => {
        result.current.dispatch({ type: "CONTINUE_AFTER_WIN" });
      });
      // State reference unchanged when action has no effect
      expect(result.current.state).toBe(stateBefore);
    });
  });
});
