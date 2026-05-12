/**
 * Tests for RenderModeContext (WO-017).
 */
import { useContext } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { RenderModeProvider, useRenderMode, RenderModeContext } from "./RenderModeContext.js";
import { storage } from "./storage.js";

vi.mock("./storage.js", () => ({
  storage: {
    getGameState: vi.fn(() => null),
    setGameState: vi.fn(),
    clearGameState: vi.fn(),
    getBestScore: vi.fn(() => 0),
    setBestScore: vi.fn(),
    getUserPreference: vi.fn(() => null),
    setUserPreference: vi.fn(),
  },
}));

const mockedStorage = vi.mocked(storage);

beforeEach(() => {
  vi.clearAllMocks();
  mockedStorage.getUserPreference.mockReturnValue(null); // no saved preference
});

function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return <RenderModeProvider>{children}</RenderModeProvider>;
}

describe("RenderModeContext (WO-017)", () => {
  describe("default mode", () => {
    it("defaults to '2d' when no preference is stored", () => {
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      expect(result.current.mode).toBe("2d");
    });

    it("restores '3d' from storage when saved", () => {
      mockedStorage.getUserPreference.mockReturnValue({ renderMode: "3d" });
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      expect(result.current.mode).toBe("3d");
    });

    it("restores '2d' from storage when saved", () => {
      mockedStorage.getUserPreference.mockReturnValue({ renderMode: "2d" });
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      expect(result.current.mode).toBe("2d");
    });

    it("falls back to '2d' when no stored preference", () => {
      mockedStorage.getUserPreference.mockReturnValue(null);
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      expect(result.current.mode).toBe("2d");
    });
  });

  describe("toggleMode", () => {
    it("switches from '2d' to '3d'", () => {
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      act(() => { result.current.toggleMode(); });
      expect(result.current.mode).toBe("3d");
    });

    it("switches from '3d' back to '2d'", () => {
      mockedStorage.getUserPreference.mockReturnValue({ renderMode: "3d" });
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      act(() => { result.current.toggleMode(); });
      expect(result.current.mode).toBe("2d");
    });

    it("persists the new mode to storage", () => {
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      act(() => { result.current.toggleMode(); });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedStorage.setUserPreference).toHaveBeenCalledWith({ renderMode: "3d" });
    });

    it("toggles again to persist '2d'", () => {
      const { result } = renderHook(() => useRenderMode(), { wrapper });
      act(() => { result.current.toggleMode(); });
      act(() => { result.current.toggleMode(); });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedStorage.setUserPreference).toHaveBeenLastCalledWith({ renderMode: "2d" });
    });
  });

  describe("useRenderMode hook", () => {
    it("throws when used outside <RenderModeProvider>", () => {
      // Suppress the React error boundary console output in tests
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() => {
        renderHook(() => useRenderMode());
      }).toThrow("useRenderMode() must be used inside <RenderModeProvider>");
      consoleSpy.mockRestore();
    });
  });

  describe("RenderModeProvider renders children", () => {
    it("renders children without errors", () => {
      render(
        <RenderModeProvider>
          <span data-testid="child">child content</span>
        </RenderModeProvider>,
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("updates children when mode toggles", () => {
      function Consumer(): React.ReactElement {
        const { mode, toggleMode } = useRenderMode();
        return (
          <button type="button" onClick={toggleMode} data-testid="toggle">
            {mode}
          </button>
        );
      }
      render(
        <RenderModeProvider>
          <Consumer />
        </RenderModeProvider>,
      );
      const btn = screen.getByTestId("toggle");
      expect(btn.textContent).toBe("2d");
      fireEvent.click(btn);
      expect(btn.textContent).toBe("3d");
    });
  });

  describe("RenderModeContext.Provider value", () => {
    it("context is null when no provider is present", () => {
      const { result } = renderHook(() => useContext(RenderModeContext));
      expect(result.current).toBeNull();
    });
  });
});
