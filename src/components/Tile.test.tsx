/**
 * Tests for the Tile component (WO-018).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tile } from "./Tile.js";
import type { Tile as TileModel } from "../engine/tile.js";
import { WIN_VALUE } from "../config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTile(overrides: Partial<TileModel> = {}): TileModel {
  return {
    x: 0,
    y: 0,
    value: 2,
    previousPosition: null,
    mergedFrom: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tile (WO-018)", () => {
  describe("value display", () => {
    it("renders the tile value as text", () => {
      render(<Tile tile={makeTile({ value: 4 })} />);
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("renders larger values correctly", () => {
      render(<Tile tile={makeTile({ value: 2048 })} />);
      expect(screen.getByText("2048")).toBeInTheDocument();
    });
  });

  describe("CSS classes", () => {
    it("includes the value class (tile-N)", () => {
      const { container } = render(<Tile tile={makeTile({ value: 8 })} />);
      expect(container.querySelector(".tile-8")).toBeInTheDocument();
    });

    it("includes the position class tile-position-1-1 for (0,0)", () => {
      const { container } = render(<Tile tile={makeTile({ x: 0, y: 0 })} />);
      expect(container.querySelector(".tile-position-1-1")).toBeInTheDocument();
    });

    it("includes the position class tile-position-3-2 for (2,1)", () => {
      const { container } = render(<Tile tile={makeTile({ x: 2, y: 1 })} />);
      expect(container.querySelector(".tile-position-3-2")).toBeInTheDocument();
    });

    it("includes tile-new class for a fresh tile (no previousPosition, no mergedFrom)", () => {
      const { container } = render(<Tile tile={makeTile()} />);
      const tileDivs = container.querySelectorAll(".tile");
      // The main tile (last one rendered, no aria-hidden) should have tile-new
      const mainTile = [...tileDivs].find((el) => !el.hasAttribute("aria-hidden"));
      expect(mainTile?.classList.contains("tile-new")).toBe(true);
    });

    it("does not include tile-new when tile has a previousPosition", () => {
      const tile = makeTile({ previousPosition: { x: 1, y: 0 } });
      const { container } = render(<Tile tile={tile} />);
      const mainTile = [...container.querySelectorAll(".tile")].find(
        (el) => !el.hasAttribute("aria-hidden"),
      );
      expect(mainTile?.classList.contains("tile-new")).toBe(false);
    });

    it("includes tile-merged class for a merged tile", () => {
      const source1 = makeTile({ x: 0, y: 0, value: 2 });
      const source2 = makeTile({ x: 1, y: 0, value: 2 });
      const merged = makeTile({ value: 4, mergedFrom: [source1, source2] });
      const { container } = render(<Tile tile={merged} />);
      const mainTile = [...container.querySelectorAll(".tile")].find(
        (el) => !el.hasAttribute("aria-hidden"),
      );
      expect(mainTile?.classList.contains("tile-merged")).toBe(true);
    });

    it("includes tile-super class for values above WIN_VALUE", () => {
      const tile = makeTile({ value: WIN_VALUE * 2 });
      const { container } = render(<Tile tile={tile} />);
      const mainTile = [...container.querySelectorAll(".tile")].find(
        (el) => !el.hasAttribute("aria-hidden"),
      );
      expect(mainTile?.classList.contains("tile-super")).toBe(true);
    });

    it("does not include tile-super class for WIN_VALUE itself", () => {
      const tile = makeTile({ value: WIN_VALUE });
      const { container } = render(<Tile tile={tile} />);
      const mainTile = [...container.querySelectorAll(".tile")].find(
        (el) => !el.hasAttribute("aria-hidden"),
      );
      expect(mainTile?.classList.contains("tile-super")).toBe(false);
    });
  });

  describe("merge ghost tiles", () => {
    it("renders two ghost tiles for merged tiles", () => {
      const source1 = makeTile({ x: 0, y: 0, value: 4 });
      const source2 = makeTile({ x: 1, y: 0, value: 4 });
      const merged = makeTile({ value: 8, mergedFrom: [source1, source2] });
      const { container } = render(<Tile tile={merged} />);

      // Ghost tiles have aria-hidden="true"
      const ghosts = container.querySelectorAll("[aria-hidden='true']");
      expect(ghosts).toHaveLength(2);
    });

    it("ghost tiles are aria-hidden", () => {
      const source1 = makeTile({ x: 0, y: 0, value: 2 });
      const source2 = makeTile({ x: 0, y: 1, value: 2 });
      const merged = makeTile({ value: 4, mergedFrom: [source1, source2] });
      const { container } = render(<Tile tile={merged} />);
      const ghosts = container.querySelectorAll("[aria-hidden='true']");
      expect(ghosts.length).toBeGreaterThan(0);
    });

    it("renders no ghost tiles for non-merged tiles", () => {
      const { container } = render(<Tile tile={makeTile()} />);
      const ghosts = container.querySelectorAll("[aria-hidden='true']");
      expect(ghosts).toHaveLength(0);
    });
  });

  describe("accessibility", () => {
    it("tile has aria-label with its value", () => {
      render(<Tile tile={makeTile({ value: 16 })} />);
      expect(screen.getByLabelText("16")).toBeInTheDocument();
    });
  });
});
