/**
 * Layout and responsive compliance tests (WO-029)
 *
 * These tests verify structural requirements that can be checked without
 * running a browser: viewport meta content, CSS design-token values,
 * and SCSS variable correctness. Visual contrast ratios are verified
 * against the computed values documented in the SCSS comments.
 *
 * Note: Actual pixel-level layout rendering requires a real browser engine.
 * These tests serve as a contract check to prevent regressions in the
 * configuration that drives the layout.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const root = path.resolve(process.cwd());
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf-8");
const variables = fs.readFileSync(path.join(root, "src/styles/_variables.scss"), "utf-8");
const mainScss = fs.readFileSync(path.join(root, "src/styles/main.scss"), "utf-8");

// ---------------------------------------------------------------------------
// Viewport meta tag (WO-029, criterion 2)
// ---------------------------------------------------------------------------

describe("viewport meta tag (WO-029)", () => {
  const viewportMeta = /<meta[^>]+name=["']viewport["'][^>]*>/.exec(indexHtml)?.[0] ?? "";

  it("includes width=device-width and initial-scale=1.0", () => {
    expect(viewportMeta).toMatch(/width=device-width/);
    expect(viewportMeta).toMatch(/initial-scale=1/);
  });

  it("does not include deprecated target-densitydpi", () => {
    expect(viewportMeta).not.toMatch(/target-densitydpi/);
  });

  it("does not include deprecated minimal-ui", () => {
    expect(viewportMeta).not.toMatch(/minimal-ui/);
  });

  it("does not include user-scalable=no (prevents zooming — accessibility violation)", () => {
    expect(viewportMeta).not.toMatch(/user-scalable=no/);
  });

  it("html element has lang attribute", () => {
    expect(indexHtml).toMatch(/<html[^>]+lang=/);
  });
});

// ---------------------------------------------------------------------------
// Color contrast — design tokens (WO-029, criterion 1)
// ---------------------------------------------------------------------------

describe("color contrast — design tokens (WO-029)", () => {
  it("$color-text is darkened to #4a3f38 for WCAG 2.1 AA compliance", () => {
    expect(variables).toMatch(/\$color-text:\s*#4a3f38/);
  });

  it("$color-score-bg is darkened to #6e6560 for contrast with light text", () => {
    expect(variables).toMatch(/\$color-score-bg:\s*#6e6560/);
  });

  it("tile-8 uses dark text ($color-text) — was $color-text-light", () => {
    // The tile-colors map entry for 8 should now use $color-text
    const tileSection = variables.slice(
      variables.indexOf("$tile-colors"),
      variables.indexOf(");", variables.indexOf("$tile-colors")),
    );
    const tile8Line = tileSection.split("\n").find((l) => l.includes("8:"));
    // Should reference $color-text, not $color-text-light
    expect(tile8Line).toBeDefined();
    expect(tile8Line).toContain("$color-text");
    expect(tile8Line).not.toContain("$color-text-light");
  });

  it("tile-16 uses dark text ($color-text) — was $color-text-light", () => {
    const tileSection = variables.slice(
      variables.indexOf("$tile-colors"),
      variables.indexOf(");", variables.indexOf("$tile-colors")),
    );
    const tile16Line = tileSection.split("\n").find((l) => /^\s*16:/.test(l));
    expect(tile16Line).toBeDefined();
    expect(tile16Line).toContain("$color-text");
    expect(tile16Line).not.toContain("$color-text-light");
  });

  it("tiles 2 and 4 use dark text ($color-text)", () => {
    const tileSection = variables.slice(
      variables.indexOf("$tile-colors"),
      variables.indexOf(");", variables.indexOf("$tile-colors")),
    );
    const tile2Line = tileSection.split("\n").find((l) => /^\s*2:/.test(l));
    const tile4Line = tileSection.split("\n").find((l) => /^\s*4:/.test(l));
    expect(tile2Line).toContain("$color-text");
    expect(tile4Line).toContain("$color-text");
  });
});

// ---------------------------------------------------------------------------
// Responsive layout — SCSS structure (WO-029, criterion 3)
// ---------------------------------------------------------------------------

describe("responsive layout — SCSS (WO-029)", () => {
  it("includes a mobile breakpoint at or below 520px", () => {
    expect(mainScss).toMatch(/@media screen and \(max-width: 520px\)/);
  });

  it("container has max-width: 100% to prevent overflow on narrow screens", () => {
    expect(mainScss).toMatch(/\.container\s*\{[^}]*max-width:\s*100%/s);
  });

  it("container uses margin: 0 auto for centering", () => {
    expect(mainScss).toMatch(/\.container\s*\{[^}]*margin:\s*0 auto/s);
  });

  it("mobile container width is defined", () => {
    expect(mainScss).toMatch(/\$container-width-mobile:/);
  });

  it("includes a visually-hidden utility class for screen reader content", () => {
    expect(mainScss).toMatch(/\.visually-hidden\s*\{/);
  });
});

// ---------------------------------------------------------------------------
// Touch targets (WO-029, criterion 4)
// ---------------------------------------------------------------------------

describe("touch target sizes (WO-029)", () => {
  it("control-button has min-height: 44px", () => {
    expect(mainScss).toMatch(/\.control-button\s*\{[^}]*min-height:\s*44px/s);
  });
});
