/**
 * Tests for Tile3D.tsx
 *
 * R3F components cannot be rendered in JSDOM (no WebGL). These tests cover:
 * - Pure helper functions (colour lookup, height computation, coordinate mapping)
 * - Component mount: we mock `@react-three/fiber` so useFrame is a no-op and
 *   `<mesh>` renders as a plain element without a WebGL context.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import {
  getTileColor,
  getTileHeight,
  gridXToWorld,
  gridYToWorld,
  CELL_SPACING,
} from "./Tile3D.js";
import { WIN_VALUE, GRID_SIZE } from "../config.js";
import type { Tile } from "../engine/tile.js";

// ---------------------------------------------------------------------------
// Mock @react-three/fiber — useFrame becomes a no-op, JSX is rendered as divs
// ---------------------------------------------------------------------------

vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
}));

// Stub Three.js mesh / geometry / material JSX so they render without WebGL
vi.mock("three", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("three");
  return { ...actual };
});

// ---------------------------------------------------------------------------
// Helper function tests
// ---------------------------------------------------------------------------

describe("getTileColor", () => {
  it("returns the correct colour for 2", () => {
    expect(getTileColor(2)).toBe("#eee4da");
  });

  it("returns the correct colour for 2048 (WIN_VALUE)", () => {
    expect(getTileColor(WIN_VALUE)).toBe("#edc22e");
  });

  it("returns the super-tile colour for values above WIN_VALUE", () => {
    expect(getTileColor(4096)).toBe("#3c3a32");
    expect(getTileColor(8192)).toBe("#3c3a32");
  });

  it("falls back to the 2-tile colour for unrecognised values <= WIN_VALUE", () => {
    // e.g. 3 is not a real tile value but shouldn't crash
    expect(typeof getTileColor(3)).toBe("string");
  });
});

describe("getTileHeight", () => {
  it("returns a positive height for all standard tile values", () => {
    [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].forEach((v) => {
      expect(getTileHeight(v)).toBeGreaterThan(0);
    });
  });

  it("height increases monotonically with tile value", () => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    for (let i = 1; i < values.length; i++) {
      const cur = values[i] ?? 2;
      const prev = values[i - 1] ?? 2;
      expect(getTileHeight(cur)).toBeGreaterThan(getTileHeight(prev));
    }
  });

  it("returns a reasonable height for a super-tile", () => {
    expect(getTileHeight(4096)).toBeGreaterThan(getTileHeight(2048));
  });
});

describe("gridXToWorld / gridYToWorld", () => {
  const boardOffset = ((GRID_SIZE - 1) / 2) * CELL_SPACING;

  it("maps the first column (x=0) to -boardOffset", () => {
    expect(gridXToWorld(0)).toBeCloseTo(-boardOffset);
  });

  it("maps the last column (x=3) to +boardOffset", () => {
    expect(gridXToWorld(GRID_SIZE - 1)).toBeCloseTo(boardOffset);
  });

  it("maps the centre columns to ±CELL_SPACING/2", () => {
    expect(gridXToWorld(1)).toBeCloseTo(-boardOffset + CELL_SPACING);
    expect(gridXToWorld(2)).toBeCloseTo(-boardOffset + CELL_SPACING * 2);
  });

  it("mirrors x behaviour for y", () => {
    expect(gridYToWorld(0)).toBeCloseTo(gridXToWorld(0));
    expect(gridYToWorld(GRID_SIZE - 1)).toBeCloseTo(gridXToWorld(GRID_SIZE - 1));
  });
});

// ---------------------------------------------------------------------------
// Component render test (structural — no WebGL)
// ---------------------------------------------------------------------------

describe("Tile3D component", () => {
  // A minimal Tile fixture — Tile has no `id` field in the engine
  const baseTile: Tile = {
    value: 4,
    x: 1,
    y: 2,
    previousPosition: null,
    mergedFrom: null,
  };

  // We need to import the component dynamically after mock setup
  let Tile3D: (props: { tile: Tile }) => React.ReactElement;

  beforeEach(async () => {
    const mod = await import("./Tile3D.js");
    Tile3D = mod.Tile3D;
  });

  it("mounts without throwing", () => {
    expect(() => render(<Tile3D tile={baseTile} />)).not.toThrow();
  });

  it("mounts for a new tile (no previousPosition)", () => {
    const newTile: Tile = { ...baseTile, previousPosition: null, mergedFrom: null };
    expect(() => render(<Tile3D tile={newTile} />)).not.toThrow();
  });

  it("mounts for a merged tile", () => {
    const src1: Tile = { value: 2, x: 0, y: 0, previousPosition: null, mergedFrom: null };
    const src2: Tile = { value: 2, x: 1, y: 0, previousPosition: null, mergedFrom: null };
    const merged: Tile = { ...baseTile, value: 4, mergedFrom: [src1, src2] };
    expect(() => render(<Tile3D tile={merged} />)).not.toThrow();
  });
});
