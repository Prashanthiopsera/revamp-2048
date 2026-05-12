/**
 * Tests for the Controls component (WO-021).
 *
 * The component depends on RenderModeContext and the capabilities module.
 * We mock capabilities so we can test both the WebGL-available and
 * WebGL-unavailable code paths.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Controls } from "./Controls.js";
import { RenderModeProvider } from "../RenderModeContext.js";
import { storage } from "../storage.js";
import { strings } from "../strings.js";
import type { GameAction } from "../engine/reducer.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../capabilities.js", () => ({
  hasWebGL: vi.fn(() => true),
  hasLocalStorage: vi.fn(() => true),
  prefersReducedMotion: vi.fn(() => false),
  hasTouchSupport: vi.fn(() => false),
  hasPointerSupport: vi.fn(() => true),
  getCapabilities: vi.fn(() => ({
    webgl: true,
    localStorage: true,
    prefersReducedMotion: false,
    touch: false,
    pointer: true,
  })),
}));

vi.mock("../storage.js", () => ({
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

import { hasWebGL } from "../capabilities.js";

const mockedHasWebGL = vi.mocked(hasWebGL);
const mockedStorage = vi.mocked(storage);

function makeDispatch(): ReturnType<typeof vi.fn<(action: GameAction) => void>> {
  return vi.fn<(action: GameAction) => void>();
}

function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return <RenderModeProvider>{children}</RenderModeProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedHasWebGL.mockReturnValue(true);
  mockedStorage.getUserPreference.mockReturnValue(null);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Controls (WO-021)", () => {
  describe("New Game button", () => {
    it("renders the New Game button", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      expect(screen.getByRole("button", { name: strings.NEW_GAME })).toBeInTheDocument();
    });

    it("dispatches RESTART when New Game is clicked", () => {
      const dispatch = makeDispatch();
      render(<Controls dispatch={dispatch} />, { wrapper });
      fireEvent.click(screen.getByRole("button", { name: strings.NEW_GAME }));
      expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
    });

    it("New Game button is a semantic button element", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.NEW_GAME });
      expect(btn.tagName.toLowerCase()).toBe("button");
    });
  });

  describe("2D/3D toggle", () => {
    it("renders the toggle button with aria-label", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      expect(screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL })).toBeInTheDocument();
    });

    it("toggle button text shows the OTHER mode (starts at 2d → shows '3D View')", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn.textContent).toBe(strings.RENDER_MODE_3D);
    });

    it("toggle button text shows '2D' when mode is 3d", () => {
      mockedStorage.getUserPreference.mockReturnValue({ renderMode: "3d" });
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn.textContent).toBe(strings.RENDER_MODE_2D);
    });

    it("toggles mode when clicked", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      fireEvent.click(btn);
      expect(btn.textContent).toBe(strings.RENDER_MODE_2D);
    });

    it("toggle button has aria-pressed=false when in 2d mode", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn.getAttribute("aria-pressed")).toBe("false");
    });

    it("toggle button has aria-pressed=true when in 3d mode", () => {
      mockedStorage.getUserPreference.mockReturnValue({ renderMode: "3d" });
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn.getAttribute("aria-pressed")).toBe("true");
    });

    it("toggle button is enabled when WebGL is available", () => {
      mockedHasWebGL.mockReturnValue(true);
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn).not.toBeDisabled();
    });

    it("toggle button is disabled when WebGL is not available (in 2d mode)", () => {
      mockedHasWebGL.mockReturnValue(false);
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn).toBeDisabled();
    });

    it("toggle button has a title tooltip when disabled", () => {
      mockedHasWebGL.mockReturnValue(false);
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn.getAttribute("title")).toBeTruthy();
    });

    it("toggle button is a semantic button element", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
      expect(btn.tagName.toLowerCase()).toBe("button");
    });
  });

  describe("Undo button (WO-038)", () => {
    it("renders the Undo button", () => {
      render(<Controls dispatch={makeDispatch()} canUndo={false} />, { wrapper });
      expect(screen.getByRole("button", { name: strings.UNDO_LABEL })).toBeInTheDocument();
    });

    it("Undo button text comes from strings module", () => {
      render(<Controls dispatch={makeDispatch()} canUndo={false} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.UNDO_LABEL });
      expect(btn.textContent).toBe(strings.UNDO);
    });

    it("Undo button is disabled when canUndo is false", () => {
      render(<Controls dispatch={makeDispatch()} canUndo={false} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.UNDO_LABEL });
      expect(btn).toBeDisabled();
    });

    it("Undo button is disabled by default (canUndo not provided)", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.UNDO_LABEL });
      expect(btn).toBeDisabled();
    });

    it("Undo button is enabled when canUndo is true", () => {
      render(<Controls dispatch={makeDispatch()} canUndo={true} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.UNDO_LABEL });
      expect(btn).not.toBeDisabled();
    });

    it("dispatches UNDO when clicked and canUndo is true", () => {
      const dispatch = makeDispatch();
      render(<Controls dispatch={dispatch} canUndo={true} />, { wrapper });
      fireEvent.click(screen.getByRole("button", { name: strings.UNDO_LABEL }));
      expect(dispatch).toHaveBeenCalledWith({ type: "UNDO" });
    });

    it("Undo button has aria-label='Undo last move'", () => {
      render(<Controls dispatch={makeDispatch()} canUndo={false} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.UNDO_LABEL });
      expect(btn.getAttribute("aria-label")).toBe(strings.UNDO_LABEL);
    });

    it("Undo button is a semantic button element", () => {
      render(<Controls dispatch={makeDispatch()} canUndo={false} />, { wrapper });
      const btn = screen.getByRole("button", { name: strings.UNDO_LABEL });
      expect(btn.tagName.toLowerCase()).toBe("button");
    });
  });

  describe("group container", () => {
    it("renders controls in a group with aria-label", () => {
      render(<Controls dispatch={makeDispatch()} />, { wrapper });
      expect(screen.getByRole("group", { name: "Game controls" })).toBeInTheDocument();
    });
  });
});
