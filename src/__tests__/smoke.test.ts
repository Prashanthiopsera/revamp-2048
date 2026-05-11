/**
 * Smoke test — verifies the Vitest + jsdom + jest-dom stack is wired up correctly.
 * This file intentionally contains only trivial assertions; real game logic and
 * component tests are added in their dedicated work orders (WO-030 through WO-033).
 */
import { describe, it, expect } from "vitest";

describe("Vitest smoke test", () => {
  it("runs a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has access to jsdom globals", () => {
    // If jsdom is configured, document and window are defined
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });

  it("jest-dom matchers are available via test-setup", () => {
    const el = document.createElement("div");
    el.textContent = "hello";
    document.body.appendChild(el);

    // toBeInTheDocument is provided by @testing-library/jest-dom
    expect(el).toBeInTheDocument();

    document.body.removeChild(el);
  });
});
