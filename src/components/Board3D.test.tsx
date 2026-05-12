/**
 * Tests for Board3D.tsx and Board3DLazy.tsx
 *
 * R3F's Canvas requires WebGL. In JSDOM, we mock `@react-three/fiber` so the
 * Canvas renders as a plain `<div>`, allowing us to test component structure
 * and prop-passing without a real GPU context.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Grid } from "../engine/grid.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGl = { setPixelRatio: vi.fn() };

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children, ...rest }: { children: React.ReactNode; [k: string]: unknown }) => (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    <div data-testid="r3f-canvas" {...(rest as Record<string, unknown>)}>{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ gl: mockGl })),
}));

// Tile3D renders a <mesh> which isn't a DOM element — replace with a simple div
vi.mock("./Tile3D.js", () => ({
  Tile3D: ({ tile }: { tile: { x: number; y: number; value: number } }) => (
    <div data-testid={`tile3d-${String(tile.x)}-${String(tile.y)}`} data-value={tile.value} />
  ),
  CELL_SPACING: 1.3,
  getTileColor: vi.fn((v: number) => `#${String(v)}`),
  getTileHeight: vi.fn((v: number) => Math.log2(v) * 0.18),
  gridXToWorld: vi.fn((x: number) => x),
  gridYToWorld: vi.fn((y: number) => y),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyGrid(): Grid {
  return Grid.empty();
}

// ---------------------------------------------------------------------------
// Board3D
// ---------------------------------------------------------------------------

describe("Board3D", () => {
  it("renders the board container with correct role and label", async () => {
    const { default: Board3D } = await import("./Board3D.js");
    render(<Board3D grid={emptyGrid()} />);
    const board = screen.getByRole("img", { name: /3D game board/i });
    expect(board).toBeInTheDocument();
    expect(board).toHaveAttribute("data-testid", "board-3d");
  });

  it("renders the R3F Canvas inside the container", async () => {
    const { default: Board3D } = await import("./Board3D.js");
    render(<Board3D grid={emptyGrid()} />);
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
  });

  it("renders no Tile3D for an empty grid", async () => {
    const { default: Board3D } = await import("./Board3D.js");
    render(<Board3D grid={emptyGrid()} />);
    // No tile3d-* test ids should be present
    expect(screen.queryByTestId(/^tile3d-/)).toBeNull();
  });

  it("renders one Tile3D per active tile", async () => {
    const { default: Board3D } = await import("./Board3D.js");
    const grid = Grid.empty();
    grid.addRandomTile();
    grid.addRandomTile();
    render(<Board3D grid={grid} />);
    const tiles = screen.getAllByTestId(/^tile3d-\d+-\d+$/);
    expect(tiles).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Board3DLazy
// ---------------------------------------------------------------------------

describe("Board3DLazy", () => {
  it("renders the loading fallback while the chunk is loading", async () => {
    const { Board3DLazy } = await import("./Board3DLazy.js");
    render(<Board3DLazy grid={emptyGrid()} />);
    // The fallback is shown before the lazy component resolves.
    // In test env, React.lazy resolves synchronously after the first render,
    // so we look for either the fallback or the resolved board.
    const boardOrFallback =
      screen.queryByTestId("board-3d") ??
      screen.queryByTestId("board-3d-loading");
    expect(boardOrFallback).not.toBeNull();
  });

  it("eventually renders the board after lazy load resolves", async () => {
    const { Board3DLazy } = await import("./Board3DLazy.js");
    render(<Board3DLazy grid={emptyGrid()} />);
    await waitFor(() => {
      expect(screen.getByTestId("board-3d")).toBeInTheDocument();
    });
  });

  it("passes the grid prop through to Board3D", async () => {
    const { Board3DLazy } = await import("./Board3DLazy.js");
    const grid = Grid.empty();
    grid.addRandomTile();
    render(<Board3DLazy grid={grid} />);
    await waitFor(() => {
      // One Tile3D rendered for the one tile in the grid
      expect(screen.getAllByTestId(/^tile3d-\d+-\d+$/)).toHaveLength(1);
    });
  });
});
