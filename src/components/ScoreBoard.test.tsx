/**
 * Tests for the ScoreBoard component (WO-019).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBoard } from "./ScoreBoard.js";
import { strings } from "../strings.js";

describe("ScoreBoard (WO-019)", () => {
  describe("rendering", () => {
    it("renders without errors", () => {
      expect(() => { render(<ScoreBoard score={0} bestScore={0} />); }).not.toThrow();
    });

    it("renders the SCORE label", () => {
      render(<ScoreBoard score={0} bestScore={0} />);
      expect(screen.getByText(strings.SCORE_LABEL)).toBeInTheDocument();
    });

    it("renders the BEST label", () => {
      render(<ScoreBoard score={0} bestScore={0} />);
      expect(screen.getByText(strings.BEST_LABEL)).toBeInTheDocument();
    });

    it("displays the current score value", () => {
      render(<ScoreBoard score={256} bestScore={0} />);
      expect(screen.getByText("256")).toBeInTheDocument();
    });

    it("displays the best score value", () => {
      render(<ScoreBoard score={0} bestScore={1024} />);
      expect(screen.getByText("1024")).toBeInTheDocument();
    });

    it("displays both score and best score simultaneously", () => {
      render(<ScoreBoard score={128} bestScore={512} />);
      expect(screen.getByText("128")).toBeInTheDocument();
      expect(screen.getByText("512")).toBeInTheDocument();
    });
  });

  describe("ARIA", () => {
    it("score container has aria-live=polite", () => {
      const { container } = render(<ScoreBoard score={100} bestScore={0} />);
      const scoreDiv = container.querySelector(".score-container");
      expect(scoreDiv?.getAttribute("aria-live")).toBe("polite");
    });

    it("best container has aria-live=polite", () => {
      const { container } = render(<ScoreBoard score={0} bestScore={200} />);
      const bestDiv = container.querySelector(".best-container");
      expect(bestDiv?.getAttribute("aria-live")).toBe("polite");
    });

    it("score container has aria-label with current score", () => {
      render(<ScoreBoard score={42} bestScore={0} />);
      const expected = strings.SCORE_ANNOUNCEMENT.replace("{score}", "42");
      expect(screen.getByLabelText(expected)).toBeInTheDocument();
    });

    it("best container has aria-label with best score", () => {
      render(<ScoreBoard score={0} bestScore={99} />);
      const expected = strings.BEST_ANNOUNCEMENT.replace("{score}", "99");
      expect(screen.getByLabelText(expected)).toBeInTheDocument();
    });
  });

  describe("score delta animation", () => {
    it("does not show +N addition on initial render", () => {
      const { container } = render(<ScoreBoard score={0} bestScore={0} />);
      expect(container.querySelector(".score-addition")).not.toBeInTheDocument();
    });

    it("does not show +N addition when score is non-zero on initial render", () => {
      // On initial render, prevScore starts at score so diff = 0
      const { container } = render(<ScoreBoard score={100} bestScore={0} />);
      expect(container.querySelector(".score-addition")).not.toBeInTheDocument();
    });

    it("shows +N addition when score increases", () => {
      const { container, rerender } = render(<ScoreBoard score={0} bestScore={0} />);
      rerender(<ScoreBoard score={4} bestScore={0} />);
      expect(container.querySelector(".score-addition")).toBeInTheDocument();
      expect(container.querySelector(".score-addition")?.textContent).toBe("+4");
    });

    it("does not show +N addition when score stays the same", () => {
      const { container, rerender } = render(<ScoreBoard score={100} bestScore={0} />);
      rerender(<ScoreBoard score={100} bestScore={0} />);
      expect(container.querySelector(".score-addition")).not.toBeInTheDocument();
    });
  });
});
