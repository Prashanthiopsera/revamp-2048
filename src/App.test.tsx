/**
 * Tests for App.tsx and GameApp.tsx (WO-017).
 *
 * These are integration tests — they render the full component tree and verify
 * that the semantic structure, strings, and basic interactions work.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "./App.js";
import { strings } from "./strings.js";

// ---------------------------------------------------------------------------
// Mock storage so tests don't touch localStorage
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
