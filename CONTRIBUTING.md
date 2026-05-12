# Contributing to revamp-2048

Thank you for contributing! This guide covers everything you need to submit a high-quality pull request.

---

## Prerequisites

- **Node.js 22 LTS** — `node --version` should print `v22.x.x`
- **npm 10+** — bundled with Node 22

No Ruby, no Sass gem, no Rakefile. Everything is npm scripts.

---

## Setup

```bash
git clone https://github.com/your-org/revamp-2048.git
cd revamp-2048
npm install
npm run dev        # http://localhost:5173
```

---

## Daily Workflow

Before opening a PR, run this sequence locally:

```bash
npm run lint           # ESLint — must report 0 errors
npm run format:check   # Prettier — must report no diffs
npm run test           # Vitest — all tests must pass
npm run build          # Vite production build — must succeed
```

Auto-fix formatting and lint errors:

```bash
npm run lint:fix
npm run format
```

---

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI uses this) |
| `npm run test` | Vitest — run once |
| `npm run test:watch` | Vitest — watch mode |
| `npm run test:coverage` | Vitest + V8 coverage |

---

## Code Conventions

### TypeScript

- Use ESM imports with `.js` extensions: `import { Foo } from "./foo.js"`
- Enable `exactOptionalPropertyTypes` — avoid `prop?: T` when you mean `prop?: T | undefined`
- Prefer `unknown` over `any`; narrow with type guards
- Use discriminated unions over type assertions

### React

- Functional components only
- Extract logic into custom hooks (`use{Name}`)
- All user-facing strings come from `src/strings.ts` — never hardcode text

### File structure

- One class/concern per file
- Files over 500 lines should be split
- Pure game logic lives in `src/engine/` — no React imports allowed there

### Testing

- Every new or modified source file **must** have a corresponding `*.test.ts(x)` file
- Test file mirrors the source path: `src/engine/grid.ts` → `src/engine/grid.test.ts`
- Use Vitest + React Testing Library for components
- Mock external dependencies (localStorage, browser APIs)
- Coverage targets: ≥ 90 % for engine code, ≥ 80 % for UI components

### Styling

- Use Sass (SCSS) for all styles
- Design tokens live in `src/styles/_variables.scss` — use variables, not magic values
- Follow WCAG 2.1 AA colour contrast (≥ 4.5:1 for normal text, ≥ 3:1 for large text)
- Minimum 44 px touch target on all interactive elements

---

## Branching and Commits

- Branch from the default branch: `git checkout -b wo/<id>-<short-description> origin/main`
- **One commit per work order** — squash your changes before opening a PR
- Commit message format:

  ```
  [WO-NNN] Short imperative description (≤ 72 chars)

  Longer explanation if needed. Reference acceptance criteria or
  design decisions. Avoid "also did X" — that belongs in a separate WO.
  ```

- Never push directly to `main` or the default branch

---

## CI Pipeline

Every PR must pass the following GitHub Actions checks before it can be merged:

| Check | Command |
|---|---|
| Type check | `tsc --noEmit` |
| Lint | `npm run lint` |
| Format | `npm run format:check` |
| Tests | `npm run test` |
| Build | `npm run build` |
| Dependency audit | `npm audit --audit-level=high` |

All checks are required. A red check blocks merge.

---

## Pull Request Checklist

Before marking a PR as ready for review:

- [ ] `npm run lint` — 0 errors
- [ ] `npm run format:check` — 0 diffs
- [ ] `npm run test` — all tests pass
- [ ] `npm run build` — build succeeds
- [ ] New/modified files have test coverage
- [ ] Accessibility: new interactive elements have `aria-label` and meet 44 px touch target
- [ ] No hardcoded user-facing strings (use `src/strings.ts`)
- [ ] PR description references the work order ID and links acceptance criteria

---

## License

By contributing, you agree that your changes will be licensed under the [MIT License](./LICENSE).
