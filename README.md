# 2048

A modern TypeScript/React rewrite of the classic [2048 game](https://github.com/gabrielecirulli/2048) by Gabriele Cirulli.

## Features

- Classic 2048 gameplay — slide tiles, merge matching numbers, reach 2048
- **Undo last move** (BRD FR-1) — one-level undo to recover from accidental moves
- **2D / 3D rendering toggle** — switch between CSS tiles and WebGL 3D tiles at runtime
- Adaptive performance — automatic quality reduction on low-FPS devices, fallback to 2D
- Full keyboard, mouse, and swipe/touch input support
- WCAG 2.1 AA accessible — ARIA live regions, semantic HTML, 44 px touch targets
- Score persistence via `localStorage` with versioned schema and legacy migration
- Responsive layout — playable from 320 px mobile to 4 K desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 (ESM, `exactOptionalPropertyTypes`) |
| UI framework | React 18 + React Three Fiber (3D) |
| Build | Vite 6 |
| Styling | Sass (SCSS), WOFF2-only Clear Sans font |
| Testing | Vitest + React Testing Library + jest-axe |
| Linting | ESLint 9 flat config + TypeScript-ESLint |
| Formatting | Prettier |

## Prerequisites

- **Node.js 22 LTS** (or later)
- **npm 10+** (bundled with Node 22)

> Verify your versions:
> ```bash
> node --version   # v22.x.x
> npm --version    # 10.x.x
> ```

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/revamp-2048.git
cd revamp-2048

# 2. Install dependencies
npm install

# 3. Start the development server (with HMR)
npm run dev
# → Open http://localhost:5173
```

The app is now running locally. You should be able to play the game, toggle 2D/3D mode, and undo moves.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | Production build to `dist/` (hashed assets) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint on all `src/` files |
| `npm run lint:fix` | Auto-fix ESLint errors where possible |
| `npm run format` | Format `src/` with Prettier |
| `npm run format:check` | Check formatting without writing files |
| `npm run test` | Run the full test suite once (CI mode) |
| `npm run test:watch` | Run tests in watch mode (development) |
| `npm run test:coverage` | Run tests with V8 coverage report |

## Architecture Overview

The project follows a strict layered architecture — each layer depends only on layers below it.

```
src/
├── engine/             # Pure game logic — no React, no I/O
│   ├── tile.ts         # Tile data type and position helpers
│   ├── grid.ts         # 4×4 grid data structure (insertTile, eachCell, clone)
│   ├── rules.ts        # Move rules: direction vectors, traversal order, merge logic
│   └── reducer.ts      # Pure reducer (MOVE, UNDO, RESTART, CONTINUE_AFTER_WIN)
│
├── hooks/              # React hooks bridging engine to UI
│   ├── useGameEngine.ts     # Wraps reducer, persists to storage, exposes canUndo
│   ├── useInputHandler.ts   # Keyboard, pointer, swipe → GameAction dispatch
│   └── usePerformanceMonitor.ts  # FPS tracking → quality reduction callbacks
│
├── components/         # React UI components
│   ├── Board.tsx / Tile.tsx          # 2D CSS rendering
│   ├── Board3D.tsx / Tile3D.tsx      # WebGL 3D rendering (React Three Fiber)
│   ├── Board3DLazy.tsx               # Lazy-loaded 3D entry point
│   ├── ScoreBoard.tsx                # Score + best score with +N animation
│   ├── GameMessage.tsx               # Win / game-over overlay
│   ├── Controls.tsx                  # New Game, Undo, 2D/3D toggle
│   └── PerformanceToast.tsx          # Auto-dismissing performance notifications
│
├── styles/             # SCSS design tokens and component styles
│   ├── _variables.scss # Colour palette, typography, tile colours
│   └── main.scss       # Global styles + @font-face (WOFF2 Clear Sans)
│
├── config.ts           # Centralised game constants (GRID_SIZE, WIN_VALUE, …)
├── strings.ts          # i18n-ready string map (English only today)
├── storage.ts          # Typed localStorage adapter with versioning + migration
├── capabilities.ts     # Browser feature detection (WebGL, localStorage, …)
├── RenderModeContext.tsx  # React context for 2D/3D toggle state
├── GameApp.tsx         # Root orchestrator — wires all hooks and components
└── App.tsx             # React entry point
```

### Bundle sizes

Measured at head of `main`, gzip-compressed (budgets enforced in CI):

| Chunk | Raw | Gzipped | Budget |
|---|---|---|---|
| Main JS (`index-*.js`) | ~214 KB | ~68 KB | 200 KB |
| 3D lazy chunk (`Board3D-*.js`) | ~892 KB | ~241 KB | 300 KB |
| CSS (`index-*.css`) | ~9 KB | ~2 KB | — |

The 3D chunk is only fetched when the player switches to 3D mode. Run `npm run bundle:check` locally to verify budgets after any change. Open `dist/stats.html` after a build for an interactive treemap.

### Key design decisions

- **Pure engine** — `engine/` modules are framework-agnostic and fully unit-tested. The reducer is a plain function (`gameReducer(state, action) → state`) with no side effects.
- **UNDO is session-only** — `previousState` lives in the reducer's in-memory state and is never written to `localStorage`, so undo history resets on page reload.
- **3D is lazy-loaded** — `Board3DLazy.tsx` uses `React.lazy` + `Suspense` so the Three.js bundle (~900 KB) is only fetched when the player switches to 3D mode.
- **Storage is versioned** — every `localStorage` entry is wrapped in a `StorageEnvelope` carrying a schema version. On mismatch the entry is discarded rather than crashing.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contribution guide, including:

- Branch naming conventions (`wo/<id>-<slug>`)
- Commit message format (one commit per work order)
- PR workflow (squash-merge, one reviewer required)
- Code style rules (ESLint + Prettier — `npm run lint && npm run format:check`)
- Test requirements (all new/modified files must have unit tests; `npm run test` must pass)

## License

MIT © Gabriele Cirulli (original), modernised under the same terms.
See [LICENSE.txt](./LICENSE.txt) for the full text.
