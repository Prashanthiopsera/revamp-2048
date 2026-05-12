/**
 * Typed storage adapter for revamp-2048.
 *
 * ## Data classification
 * ALL data stored here is classified **Public** — it consists solely of game
 * state (tile positions, score) and user preferences (render mode). No PII,
 * credentials, or sensitive information is ever persisted.
 *
 * ## Namespaced keys
 * Keys follow the pattern `game2048:v1:<entity>` to avoid conflicts with other
 * scripts and to enable version-specific reads during schema migrations.
 *
 * ## Versioning & migration
 * Each stored value is wrapped in a `StorageEnvelope` carrying the schema
 * version and a timestamp. On first read, if the versioned key is absent but
 * the legacy key exists (written by the original 2048 codebase), the adapter
 * migrates the value to the new format automatically.
 *
 * ## Fallback
 * When `localStorage` is unavailable (private browsing, quota exceeded), an
 * in-memory `fakeStorage` is used so the app never crashes — data is simply
 * lost on page reload.
 */

import { hasLocalStorage } from "./capabilities.js";
import type { RenderMode } from "./config.js";

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

/** Version of the current storage schema. Increment when the shape changes. */
export const STORAGE_SCHEMA_VERSION = 1;

/** Namespaced key prefix. */
const NS = "game2048:v1";

export const STORAGE_KEYS = {
  gameState: `${NS}:gameState`,
  bestScore: `${NS}:bestScore`,
  preferences: `${NS}:preferences`,
} as const;

/** Legacy keys written by the original gabrielecirulli/2048 codebase. */
const LEGACY_KEYS = {
  gameState: "gameState",
  bestScore: "bestScore",
} as const;

/**
 * Envelope that wraps every stored value with metadata so we can detect
 * schema drift and stale data.
 *
 * Data classification: Public — no sensitive fields.
 */
export interface StorageEnvelope<T> {
  readonly version: number;
  readonly timestamp: number; // Unix ms
  readonly data: T;
}

/**
 * Serialized tile state matching the legacy `Tile` shape for migration
 * compatibility and future engine interop.
 */
export interface TileState {
  readonly id: number;
  readonly value: number;
  readonly row: number;
  readonly col: number;
}

/**
 * Full game session state.
 * Data classification: Public — game tile positions and score only.
 */
export interface GameSession {
  readonly score: number;
  readonly tiles: readonly TileState[];
  readonly isOver: boolean;
  readonly isWon: boolean;
  readonly isKeepingPlaying: boolean;
}

/**
 * User preference data stored across sessions.
 * Data classification: Public — render mode preference only.
 */
export interface UserPreference {
  readonly renderMode: RenderMode;
}

// ---------------------------------------------------------------------------
// In-memory fallback storage (used when localStorage is unavailable)
// ---------------------------------------------------------------------------

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Envelope helpers
// ---------------------------------------------------------------------------

function wrap(data: unknown): StorageEnvelope<unknown> {
  return { version: STORAGE_SCHEMA_VERSION, data, timestamp: Date.now() };
}

function unwrap(raw: string): unknown {
  try {
    const envelope = JSON.parse(raw) as StorageEnvelope<unknown>;
    if (envelope.version !== STORAGE_SCHEMA_VERSION) return null;
    return envelope.data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Storage adapter
// ---------------------------------------------------------------------------

export interface StorageAdapter {
  getGameState(): GameSession | null;
  setGameState(state: GameSession): void;
  clearGameState(): void;
  getBestScore(): number;
  setBestScore(score: number): void;
  getUserPreference(): UserPreference | null;
  setUserPreference(prefs: UserPreference): void;
}

function createStorageAdapter(store: Storage): StorageAdapter {
  // Returns `unknown | null` — callers cast to the concrete type they expect.
  // Keeping T out of the signature avoids the no-unnecessary-type-parameters lint rule.
  function read(key: string, legacyKey?: string): unknown {
    const raw = store.getItem(key);
    if (raw !== null) return unwrap(raw);

    // Legacy migration: read the old key, re-save in new format, delete old key
    if (legacyKey) {
      const legacyRaw = store.getItem(legacyKey);
      if (legacyRaw !== null) {
        try {
          const legacyData: unknown = JSON.parse(legacyRaw);
          store.setItem(key, JSON.stringify(wrap(legacyData)));
          store.removeItem(legacyKey);
          return legacyData;
        } catch {
          store.removeItem(legacyKey);
        }
      }
    }
    return null;
  }

  function write(key: string, data: unknown): void {
    try {
      store.setItem(key, JSON.stringify(wrap(data)));
    } catch {
      // Quota exceeded or storage locked — silently ignore (fakeStorage prevents crashes)
    }
  }

  return {
    getGameState() {
      return (read(STORAGE_KEYS.gameState, LEGACY_KEYS.gameState) as GameSession | null) ?? null;
    },
    setGameState(state) {
      write(STORAGE_KEYS.gameState, state);
    },
    clearGameState() {
      store.removeItem(STORAGE_KEYS.gameState);
    },
    getBestScore() {
      const score = read(STORAGE_KEYS.bestScore, LEGACY_KEYS.bestScore) as number | null;
      return score ?? 0;
    },
    setBestScore(score) {
      write(STORAGE_KEYS.bestScore, score);
    },
    getUserPreference() {
      return (read(STORAGE_KEYS.preferences) as UserPreference | null) ?? null;
    },
    setUserPreference(prefs) {
      write(STORAGE_KEYS.preferences, prefs);
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * The app-wide storage adapter.
 *
 * Uses `localStorage` when available; falls back to an in-memory store when
 * the browser blocks access (private mode, quota exceeded, etc.).
 */
export const storage: StorageAdapter = createStorageAdapter(
  hasLocalStorage() ? localStorage : createFakeStorage(),
);

/** Exposed for testing only — creates an isolated adapter over a given store. */
export { createStorageAdapter, createFakeStorage };
