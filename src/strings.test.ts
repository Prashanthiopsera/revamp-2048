import { describe, it, expect } from "vitest";
import { strings, getStrings } from "./strings.js";
import type { StringMap, Locale } from "./strings.js";

describe("strings.ts (WO-009)", () => {
  describe("default English strings object", () => {
    it("exports a non-empty strings object", () => {
      expect(strings).toBeDefined();
    });

    it("dir is ltr for English", () => {
      expect(strings.dir).toBe("ltr");
    });

    it("has game identity strings", () => {
      expect(strings.GAME_TITLE).toBe("2048");
      expect(strings.GAME_SUBTITLE).toBeTruthy();
    });

    it("has score label strings", () => {
      expect(strings.SCORE_LABEL).toBeTruthy();
      expect(strings.BEST_LABEL).toBeTruthy();
    });

    it("has game message strings", () => {
      expect(strings.GAME_WON).toBeTruthy();
      expect(strings.GAME_WON_SUBTITLE).toBeTruthy();
      expect(strings.GAME_OVER).toBeTruthy();
      expect(strings.GAME_OVER_SUBTITLE).toBeTruthy();
    });

    it("has action strings", () => {
      expect(strings.KEEP_PLAYING).toBeTruthy();
      expect(strings.TRY_AGAIN).toBeTruthy();
      expect(strings.NEW_GAME).toBeTruthy();
    });

    it("has how-to-play strings", () => {
      expect(strings.HOW_TO_PLAY).toBeTruthy();
      expect(strings.HOW_TO_PLAY_DETAIL).toBeTruthy();
    });

    it("has ARIA/accessibility strings", () => {
      expect(strings.TILE_LABEL).toBeTruthy();
      expect(strings.SCORE_ANNOUNCEMENT).toBeTruthy();
      expect(strings.BEST_ANNOUNCEMENT).toBeTruthy();
    });

    it("has render mode toggle strings", () => {
      expect(strings.RENDER_MODE_2D).toBeTruthy();
      expect(strings.RENDER_MODE_3D).toBeTruthy();
      expect(strings.RENDER_MODE_TOGGLE_LABEL).toBeTruthy();
    });

    it("no string value is an empty string", () => {
      for (const [key, value] of Object.entries(strings)) {
        if (key === "dir") continue;
        expect(value, `Key "${key}" must not be empty`).not.toBe("");
      }
    });
  });

  describe("getStrings()", () => {
    it("returns English strings for 'en' locale", () => {
      const en = getStrings("en");
      expect(en.GAME_TITLE).toBe("2048");
    });

    it("defaults to English when called with no argument", () => {
      const defaultStrings = getStrings();
      expect(defaultStrings.dir).toBe("ltr");
    });

    it("returned object satisfies StringMap interface (type check)", () => {
      const result: StringMap = getStrings("en");
      expect(result).toBeDefined();
    });
  });

  describe("StringMap interface completeness", () => {
    it("all required keys are present on the English locale", () => {
      const requiredKeys: (keyof StringMap)[] = [
        "dir",
        "GAME_TITLE",
        "GAME_SUBTITLE",
        "SCORE_LABEL",
        "BEST_LABEL",
        "GAME_WON",
        "GAME_WON_SUBTITLE",
        "GAME_OVER",
        "GAME_OVER_SUBTITLE",
        "KEEP_PLAYING",
        "TRY_AGAIN",
        "NEW_GAME",
        "HOW_TO_PLAY",
        "HOW_TO_PLAY_DETAIL",
        "TILE_LABEL",
        "SCORE_ANNOUNCEMENT",
        "BEST_ANNOUNCEMENT",
        "RENDER_MODE_2D",
        "RENDER_MODE_3D",
        "RENDER_MODE_TOGGLE_LABEL",
      ];

      for (const key of requiredKeys) {
        expect(strings[key], `Missing key: ${key}`).toBeDefined();
      }
    });

    it("Locale type includes 'en'", () => {
      const locale: Locale = "en";
      expect(locale).toBe("en");
    });
  });
});
