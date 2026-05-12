# Game Engine Characterization Fixtures

These fixtures encode the **expected behavior** of the 2048 game engine, derived
from analyzing the legacy `game_manager.js`, `grid.js`, and `tile.js` source files
from [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048).

They serve as **golden tests** — before the TypeScript engine is implemented, these
fixtures define what "correct" means. The engine test suite (WO-030/031) will run
each fixture to verify gameplay parity with the original.

---

## Fixture format

Each fixture is a `GameFixture` object:

```ts
interface GameFixture {
  id: string;            // unique snake_case identifier
  description: string;  // human-readable explanation
  category: FixtureCategory;
  initial: GridState;    // 4×4 grid before the action
  action: GameAction;    // move direction or command
  expected: {
    grid: GridState;     // 4×4 grid after the action
    scoreDelta: number;  // points earned this move (sum of merged tile values)
    isOver: boolean;     // true if no moves remain after this action
    isWon: boolean;      // true if a 2048 tile was created
    isKeepingPlaying: boolean; // true if won AND player chose to continue
  };
}
```

### Grid representation

A `GridState` is a `4×4` number matrix where `0` means empty:

```
[ [0, 0, 0, 2],
  [0, 0, 0, 2],
  [0, 0, 0, 0],
  [0, 0, 0, 0] ]
```

### GameAction

```ts
type Direction = 'up' | 'down' | 'left' | 'right';
type GameAction = { type: 'move'; direction: Direction }
                | { type: 'restart' }
                | { type: 'continueAfterWin' };
```

---

## Legacy rules captured in these fixtures

1. **Slide first, merge second** — tiles slide as far as possible, then adjacent
   equal tiles merge into one.
2. **No double-merge** — a tile created by merging cannot merge again in the same
   move (cascade prevention).
3. **Score** = sum of all merged tile values in the move.
4. **Win** = any tile reaches 2048 after a move.
5. **Game over** = no empty cells AND no adjacent equal tiles in any direction.
6. **Random spawn** — after each valid move, one empty cell receives a 2 (90%)
   or 4 (10%) tile. Spawn positions are not deterministic, so fixtures that
   involve spawning mark `spawnIsRandom: true` and only check the pre-spawn state.
