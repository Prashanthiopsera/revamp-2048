/**
 * Tests for the Board component (WO-018).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Board } from "./Board.js";
import { Grid } from "../engine/grid.js";
import { createTile } from "../engine/tile.js";
import { GRID_SIZE } from "../config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEmptyGrid(): Grid {
  return Grid.empty(GRID_SIZE);
}

function makeGridWithTile(x: number, y: number, value: number): Grid {
  const grid = Grid.empty(GRID_SIZE);
  grid.insertTile(createTile({ x, y }, value));
  return grid;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Board (WO-018)", () => {
  describe("rendering", () => {
    it("renders without errors on an empty grid", () => {
      expect(() => { render(<Board grid={makeEmptyGrid()} />); }).not.toThrow();
    });

    it("renders the board container with data-testid=board", () => {
      render(<Board grid={makeEmptyGrid()} />);
      expect(screen.getByTestId("board")).toBeInTheDocument();
    });

    it("renders the background grid container", () => {
      const { container } = render(<Board grid={makeEmptyGrid()} />);
      expect(container.querySelector(".grid-container")).toBeInTheDocument();
    });

    it("renders the tile container", () => {
      const { container } = render(<Board grid={makeEmptyGrid()} />);
      expect(container.querySelector(".tile-container")).toBeInTheDocument();
    });
  });

  describe("background grid cells", () => {
    it(`renders ${String(GRID_SIZE * GRID_SIZE)} background cells`, () => {
      const { container } = render(<Board grid={makeEmptyGrid()} />);
      const cells = container.querySelectorAll(".grid-cell");
      expect(cells).toHaveLength(GRID_SIZE * GRID_SIZE);
    });

    it(`renders ${String(GRID_SIZE)} grid rows`, () => {
      const { container } = render(<Board grid={makeEmptyGrid()} />);
      const rows = container.querySelectorAll(".grid-row");
      expect(rows).toHaveLength(GRID_SIZE);
    });

    it("background grid is aria-hidden", () => {
      const { container } = render(<Board grid={makeEmptyGrid()} />);
      const gridContainer = container.querySelector(".grid-container");
      expect(gridContainer?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("tile rendering", () => {
    it("renders no tile elements on an empty grid", () => {
      const { container } = render(<Board grid={makeEmptyGrid()} />);
      const tiles = container.querySelectorAll(".tile");
      expect(tiles).toHaveLength(0);
    });

    it("renders a tile when the grid has one tile", () => {
      const grid = makeGridWithTile(0, 0, 2);
      const { container } = render(<Board grid={grid} />);
      const tiles = container.querySelectorAll(".tile");
      expect(tiles.length).toBeGreaterThan(0);
    });

    it("renders tile with the correct value class", () => {
      const grid = makeGridWithTile(1, 2, 16);
      const { container } = render(<Board grid={grid} />);
      expect(container.querySelector(".tile-16")).toBeInTheDocument();
    });

    it("renders tile at the correct position class", () => {
      const grid = makeGridWithTile(2, 3, 4); // x=2,y=3 → position-3-4 (1-indexed)
      const { container } = render(<Board grid={grid} />);
      expect(container.querySelector(".tile-position-3-4")).toBeInTheDocument();
    });

    it("renders multiple tiles", () => {
      const grid = Grid.empty(GRID_SIZE);
      grid.insertTile(createTile({ x: 0, y: 0 }, 2));
      grid.insertTile(createTile({ x: 3, y: 3 }, 4));
      const { container } = render(<Board grid={grid} />);
      expect(container.querySelector(".tile-2")).toBeInTheDocument();
      expect(container.querySelector(".tile-4")).toBeInTheDocument();
    });

    it("renders two starting tiles after createInitialState", () => {
      const grid = Grid.empty(GRID_SIZE);
      grid.addRandomTile(0.9);
      grid.addRandomTile(0.9);
      const { container } = render(<Board grid={grid} />);
      // At least 2 tile divs (each fresh tile gets tile-new)
      const tiles = container.querySelectorAll(".tile.tile-new");
      expect(tiles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("accessibility", () => {
    it("tile container has an accessible label", () => {
      render(<Board grid={makeEmptyGrid()} />);
      expect(screen.getByRole("generic", { name: "Game tiles" })).toBeInTheDocument();
    });
  });
});
