import { describe, it, expect } from "vitest";
import {
  createStorageAdapter,
  createFakeStorage,
  STORAGE_KEYS,
  STORAGE_SCHEMA_VERSION,
} from "./storage.js";
import type { GameSession, StorageEnvelope, UserPreference } from "./storage.js";

// All tests use an isolated fakeStorage so real localStorage is never touched.
function makeAdapter() {
  const store = createFakeStorage();
  const adapter = createStorageAdapter(store);
  return { store, adapter };
}

const SAMPLE_STATE: GameSession = {
  score: 128,
  tiles: [
    { id: 1, value: 2, row: 0, col: 0 },
    { id: 2, value: 4, row: 1, col: 1 },
  ],
  isOver: false,
  isWon: false,
  isKeepingPlaying: false,
};

describe("storage.ts (WO-011)", () => {
  describe("fakeStorage fallback", () => {
    it("getItem returns null for unknown keys", () => {
      const store = createFakeStorage();
      expect(store.getItem("x")).toBeNull();
    });

    it("setItem/getItem round-trips a value", () => {
      const store = createFakeStorage();
      store.setItem("k", "v");
      expect(store.getItem("k")).toBe("v");
    });

    it("removeItem deletes the key", () => {
      const store = createFakeStorage();
      store.setItem("k", "v");
      store.removeItem("k");
      expect(store.getItem("k")).toBeNull();
    });

    it("clear removes all keys", () => {
      const store = createFakeStorage();
      store.setItem("a", "1");
      store.setItem("b", "2");
      store.clear();
      expect(store.length).toBe(0);
    });
  });

  describe("getGameState() / setGameState()", () => {
    it("returns null when no state is stored", () => {
      const { adapter } = makeAdapter();
      expect(adapter.getGameState()).toBeNull();
    });

    it("round-trips a GameSession", () => {
      const { adapter } = makeAdapter();
      adapter.setGameState(SAMPLE_STATE);
      expect(adapter.getGameState()).toEqual(SAMPLE_STATE);
    });

    it("stores data in the versioned envelope format", () => {
      const { adapter, store } = makeAdapter();
      adapter.setGameState(SAMPLE_STATE);
      const raw = store.getItem(STORAGE_KEYS.gameState);
      expect(raw).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const envelope = JSON.parse(raw!) as StorageEnvelope<GameSession>;
      expect(envelope.version).toBe(STORAGE_SCHEMA_VERSION);
      expect(typeof envelope.timestamp).toBe("number");
      expect(envelope.data).toEqual(SAMPLE_STATE);
    });
  });

  describe("clearGameState()", () => {
    it("removes the stored game state", () => {
      const { adapter } = makeAdapter();
      adapter.setGameState(SAMPLE_STATE);
      adapter.clearGameState();
      expect(adapter.getGameState()).toBeNull();
    });
  });

  describe("getBestScore() / setBestScore()", () => {
    it("returns 0 when no best score is stored", () => {
      const { adapter } = makeAdapter();
      expect(adapter.getBestScore()).toBe(0);
    });

    it("round-trips a best score", () => {
      const { adapter } = makeAdapter();
      adapter.setBestScore(512);
      expect(adapter.getBestScore()).toBe(512);
    });
  });

  describe("getUserPreference() / setUserPreference()", () => {
    it("returns null when no preference is stored", () => {
      const { adapter } = makeAdapter();
      expect(adapter.getUserPreference()).toBeNull();
    });

    it("round-trips a UserPreference", () => {
      const { adapter } = makeAdapter();
      const prefs: UserPreference = { renderMode: "3d" };
      adapter.setUserPreference(prefs);
      expect(adapter.getUserPreference()).toEqual(prefs);
    });
  });

  describe("legacy migration", () => {
    it("migrates legacy gameState key to namespaced key on first read", () => {
      const store = createFakeStorage();
      // Write a legacy-format value (raw JSON, no envelope)
      store.setItem("gameState", JSON.stringify(SAMPLE_STATE));
      const adapter = createStorageAdapter(store);

      const result = adapter.getGameState();
      expect(result).toEqual(SAMPLE_STATE);

      // Legacy key should be removed
      expect(store.getItem("gameState")).toBeNull();
      // New key should be present
      expect(store.getItem(STORAGE_KEYS.gameState)).not.toBeNull();
    });

    it("migrates legacy bestScore key to namespaced key on first read", () => {
      const store = createFakeStorage();
      store.setItem("bestScore", "1024");
      const adapter = createStorageAdapter(store);

      expect(adapter.getBestScore()).toBe(1024);
      expect(store.getItem("bestScore")).toBeNull();
      expect(store.getItem(STORAGE_KEYS.bestScore)).not.toBeNull();
    });

    it("ignores corrupted legacy data", () => {
      const store = createFakeStorage();
      store.setItem("gameState", "NOT_JSON{{{");
      const adapter = createStorageAdapter(store);

      expect(adapter.getGameState()).toBeNull();
      // Corrupted legacy key should be cleaned up
      expect(store.getItem("gameState")).toBeNull();
    });
  });

  describe("schema version mismatch", () => {
    it("returns null for data stored with a different schema version", () => {
      const { adapter, store } = makeAdapter();
      // Write an envelope with a future schema version
      store.setItem(
        STORAGE_KEYS.gameState,
        JSON.stringify({ version: 99, timestamp: Date.now(), data: SAMPLE_STATE }),
      );
      expect(adapter.getGameState()).toBeNull();
    });
  });

  describe("STORAGE_KEYS", () => {
    it("game state key is namespaced", () => {
      expect(STORAGE_KEYS.gameState).toBe("game2048:v1:gameState");
    });

    it("best score key is namespaced", () => {
      expect(STORAGE_KEYS.bestScore).toBe("game2048:v1:bestScore");
    });

    it("preferences key is namespaced", () => {
      expect(STORAGE_KEYS.preferences).toBe("game2048:v1:preferences");
    });
  });
});
