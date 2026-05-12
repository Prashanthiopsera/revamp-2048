/**
 * Tests for the GameMessage component (WO-020).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameMessage } from "./GameMessage.js";
import { strings } from "../strings.js";
import type { GameAction } from "../engine/reducer.js";

function makeDispatch(): ReturnType<typeof vi.fn<(action: GameAction) => void>> {
  return vi.fn<(action: GameAction) => void>();
}

describe("GameMessage (WO-020)", () => {
  describe("win state", () => {
    it("renders the win title when isWon=true", () => {
      render(<GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />);
      expect(screen.getByText(strings.GAME_WON)).toBeInTheDocument();
    });

    it("renders the win subtitle", () => {
      render(<GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />);
      expect(screen.getByText(strings.GAME_WON_SUBTITLE)).toBeInTheDocument();
    });

    it("renders 'Keep going' button when canContinue=true", () => {
      render(<GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />);
      expect(screen.getByRole("button", { name: strings.KEEP_PLAYING })).toBeInTheDocument();
    });

    it("does not render 'Keep going' button when canContinue=false", () => {
      render(<GameMessage isWon={true} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.queryByRole("button", { name: strings.KEEP_PLAYING })).not.toBeInTheDocument();
    });

    it("renders 'Try again' button in win state", () => {
      render(<GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />);
      expect(screen.getByRole("button", { name: strings.TRY_AGAIN })).toBeInTheDocument();
    });

    it("applies game-won CSS class", () => {
      const { container } = render(
        <GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />,
      );
      expect(container.querySelector(".game-won")).toBeInTheDocument();
    });
  });

  describe("loss state", () => {
    it("renders the game-over title when isWon=false", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.getByText(strings.GAME_OVER)).toBeInTheDocument();
    });

    it("renders the game-over subtitle", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.getByText(strings.GAME_OVER_SUBTITLE)).toBeInTheDocument();
    });

    it("does not render 'Keep going' button in loss state", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.queryByRole("button", { name: strings.KEEP_PLAYING })).not.toBeInTheDocument();
    });

    it("renders 'Try again' button in loss state", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.getByRole("button", { name: strings.TRY_AGAIN })).toBeInTheDocument();
    });

    it("applies game-over CSS class", () => {
      const { container } = render(
        <GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />,
      );
      expect(container.querySelector(".game-over")).toBeInTheDocument();
    });
  });

  describe("button actions", () => {
    it("dispatches CONTINUE_AFTER_WIN when 'Keep going' is clicked", () => {
      const dispatch = makeDispatch();
      render(<GameMessage isWon={true} canContinue={true} dispatch={dispatch} />);
      fireEvent.click(screen.getByRole("button", { name: strings.KEEP_PLAYING }));
      expect(dispatch).toHaveBeenCalledWith({ type: "CONTINUE_AFTER_WIN" });
    });

    it("dispatches RESTART when 'Try again' is clicked (win state)", () => {
      const dispatch = makeDispatch();
      render(<GameMessage isWon={true} canContinue={true} dispatch={dispatch} />);
      fireEvent.click(screen.getByRole("button", { name: strings.TRY_AGAIN }));
      expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
    });

    it("dispatches RESTART when 'Try again' is clicked (loss state)", () => {
      const dispatch = makeDispatch();
      render(<GameMessage isWon={false} canContinue={false} dispatch={dispatch} />);
      fireEvent.click(screen.getByRole("button", { name: strings.TRY_AGAIN }));
      expect(dispatch).toHaveBeenCalledWith({ type: "RESTART" });
    });
  });

  describe("accessibility", () => {
    it("overlay has role=dialog", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("overlay has aria-modal=true", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    });

    it("overlay aria-label matches the title for win state", () => {
      render(<GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />);
      expect(screen.getByRole("dialog", { name: strings.GAME_WON })).toBeInTheDocument();
    });

    it("overlay aria-label matches the title for loss state", () => {
      render(<GameMessage isWon={false} canContinue={false} dispatch={makeDispatch()} />);
      expect(screen.getByRole("dialog", { name: strings.GAME_OVER })).toBeInTheDocument();
    });

    it("buttons are semantic button elements, not links", () => {
      render(<GameMessage isWon={true} canContinue={true} dispatch={makeDispatch()} />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn.tagName.toLowerCase()).toBe("button");
      });
    });
  });
});
