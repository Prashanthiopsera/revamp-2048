/**
 * Tests for App.tsx and GameApp.tsx (WO-017, WO-027).
 *
 * These are integration tests — they render the full component tree and verify
 * that the semantic structure, strings, basic interactions, and 2D/3D toggle
 * behaviour work correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "./App.js";
import { strings } from "./strings.js";

// ---------------------------------------------------------------------------
// Mock storage and capabilities so tests don't touch localStorage / canvas
// ---------------------------------------------------------------------------

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

// hasWebGL() requires a real canvas context which JSDOM doesn't provide.
// Mock it to return true so the render-mode toggle is enabled in tests.
vi.mock("./capabilities.js", () => ({
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

// Stub Board3DLazy so switching to 3D doesn't require WebGL / R3F
vi.mock("./components/Board3DLazy.js", () => ({
  Board3DLazy: () => <div data-testid="board-3d-stub">3D Board</div>,
}));

// Stub usePerformanceMonitor so it doesn't run rAF loops in tests
vi.mock("./hooks/usePerformanceMonitor.js", () => ({
  usePerformanceMonitor: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("App (WO-017)", () => {
  it("renders without crashing", () => {
    expect(() => { render(<App />); }).not.toThrow();
  });

  it("renders the game title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: strings.GAME_TITLE })).toBeInTheDocument();
  });

  it("renders the game subtitle", () => {
    render(<App />);
    expect(screen.getByText(strings.GAME_SUBTITLE)).toBeInTheDocument();
  });

  it("renders the SCORE label", () => {
    render(<App />);
    expect(screen.getByText(strings.SCORE_LABEL)).toBeInTheDocument();
  });

  it("renders the BEST label", () => {
    render(<App />);
    expect(screen.getByText(strings.BEST_LABEL)).toBeInTheDocument();
  });

  it("renders the New Game button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: strings.NEW_GAME })).toBeInTheDocument();
  });

  it("renders the render-mode toggle button", () => {
    render(<App />);
    // The button aria-label is the generic TOGGLE_LABEL; text content changes with mode
    expect(screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL })).toBeInTheDocument();
  });

  it("toggles render mode button text when clicked", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
    // In 2d mode the button text offers to switch to 3d
    expect(btn.textContent).toBe(strings.RENDER_MODE_3D);
    fireEvent.click(btn);
    // After toggle, button text offers to switch back to 2d
    expect(btn.textContent).toBe(strings.RENDER_MODE_2D);
  });

  it("renders the game board", () => {
    render(<App />);
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });

  it("renders the how-to-play section", () => {
    render(<App />);
    expect(screen.getByText(strings.HOW_TO_PLAY + ":")).toBeInTheDocument();
  });

  it("score starts at 0", () => {
    render(<App />);
    // The score element contains the number — find by aria-label pattern
    const scoreEl = screen.getByLabelText(strings.SCORE_ANNOUNCEMENT.replace("{score}", "0"));
    expect(scoreEl).toBeInTheDocument();
  });

  it("best score starts at 0 when storage has no saved best", () => {
    render(<App />);
    const bestEl = screen.getByLabelText(strings.BEST_ANNOUNCEMENT.replace("{score}", "0"));
    expect(bestEl).toBeInTheDocument();
  });

  it("New Game button dispatches RESTART (score resets to 0)", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: strings.NEW_GAME });
    fireEvent.click(btn);
    // Score remains 0 after RESTART from a fresh game
    const scoreEl = screen.getByLabelText(strings.SCORE_ANNOUNCEMENT.replace("{score}", "0"));
    expect(scoreEl).toBeInTheDocument();
  });

  it("does not show game message overlay during normal play", () => {
    render(<App />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders accessible landmark regions", () => {
    render(<App />);
    expect(screen.getByRole("banner")).toBeInTheDocument(); // <header>
    expect(screen.getByRole("main")).toBeInTheDocument(); // <main>
    expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // <footer>
  });

  it("game board has aria-label for accessibility", () => {
    render(<App />);
    expect(screen.getByRole("main", { name: "2048 game board" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// WO-027: 2D/3D rendering toggle with state preservation
// ---------------------------------------------------------------------------

describe("2D/3D rendering toggle (WO-027)", () => {
  it("renders the 2D board by default (first visit)", () => {
    render(<App />);
    expect(screen.getByTestId("board")).toBeInTheDocument();
    expect(screen.queryByTestId("board-3d-stub")).toBeNull();
  });

  it("switches to 3D board when toggle is clicked", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
    fireEvent.click(btn);
    expect(screen.getByTestId("board-3d-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("board")).toBeNull();
  });

  it("switching back to 2D restores the 2D board", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
    fireEvent.click(btn); // → 3D
    fireEvent.click(btn); // → 2D
    expect(screen.getByTestId("board")).toBeInTheDocument();
    expect(screen.queryByTestId("board-3d-stub")).toBeNull();
  });

  it("game score is preserved when toggling between 2D and 3D", () => {
    render(<App />);
    // Score starts at 0 in 2D
    expect(
      screen.getByLabelText(strings.SCORE_ANNOUNCEMENT.replace("{score}", "0")),
    ).toBeInTheDocument();
    // Toggle to 3D
    const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
    fireEvent.click(btn);
    // Score is still visible (mode toggle does not reset game state)
    expect(
      screen.getByLabelText(strings.SCORE_ANNOUNCEMENT.replace("{score}", "0")),
    ).toBeInTheDocument();
  });

  it("persists mode preference to storage when toggling", async () => {
    const { storage } = vi.mocked(await import("./storage.js"));
    render(<App />);
    const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
    fireEvent.click(btn); // → 3D
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(vi.mocked(storage.setUserPreference)).toHaveBeenCalledWith({ renderMode: "3d" });
  });

  it("disables the toggle when WebGL is unavailable", async () => {
    const caps = await import("./capabilities.js");
    vi.mocked(caps.hasWebGL).mockReturnValueOnce(false);
    render(<App />);
    const btn = screen.getByRole("button", { name: strings.RENDER_MODE_TOGGLE_LABEL });
    expect(btn).toBeDisabled();
  });

  it("renders the board container with data-render-mode attribute", () => {
    render(<App />);
    const boardContainer = screen.getByTestId("board").closest("[data-render-mode]");
    expect(boardContainer).toHaveAttribute("data-render-mode", "2d");
  });
});
