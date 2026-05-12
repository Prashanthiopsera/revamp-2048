/**
 * Integration tests for the ESLint 9 flat config (WO-004).
 *
 * Uses the ESLint Node.js API to verify:
 * - The config loads without errors
 * - react-hooks rules are active and flag violations
 * - dangerouslySetInnerHTML is banned
 *
 * Fixture files are written temporarily to src/ so they fall within the
 * TypeScript project service scope (projectService requires tsconfig coverage).
 */

import { describe, it, expect, afterEach } from "vitest";
import { ESLint } from "eslint";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const eslint = new ESLint();
// process.cwd() is the repo root regardless of how Vitest resolves import.meta.url
const FIXTURE_DIR = resolve(process.cwd(), "src");
const fixtures = [];

function writeFixture(name, code) {
  const path = join(FIXTURE_DIR, name);
  writeFileSync(path, code, "utf8");
  fixtures.push(path);
  return path;
}

afterEach(() => {
  for (const path of fixtures.splice(0)) {
    try {
      unlinkSync(path);
    } catch {
      // Ignore cleanup errors — fixture may already be gone
    }
  }
});

describe("ESLint config (WO-004)", () => {
  it("loads without errors for a .tsx file", async () => {
    const cfg = await eslint.calculateConfigForFile("src/main.tsx");
    expect(cfg).toBeTruthy();
  });

  it("react-hooks/rules-of-hooks flags a hook called inside a regular function", async () => {
    const code = `
import { useState } from "react";

function notAComponent() {
  const [x, setX] = useState(0);
  return x;
}

export default notAComponent;
`;
    const path = writeFixture("__hooks_violation_fixture__.tsx", code);
    const results = await eslint.lintFiles([path]);
    const hookViolation = results[0].messages.find((m) =>
      m.ruleId?.includes("react-hooks/rules-of-hooks"),
    );
    expect(
      hookViolation,
      `Expected react-hooks/rules-of-hooks violation. Got: ${JSON.stringify(results[0].messages.map((m) => m.ruleId))}`,
    ).toBeTruthy();
  });

  it("no-restricted-syntax bans dangerouslySetInnerHTML", async () => {
    const code = `
export function Unsafe() {
  return <div dangerouslySetInnerHTML={{ __html: "<b>hi</b>" }} />;
}
`;
    const path = writeFixture("__xss_violation_fixture__.tsx", code);
    const results = await eslint.lintFiles([path]);
    const xssViolation = results[0].messages.find(
      (m) =>
        m.ruleId === "no-restricted-syntax" && m.message.includes("dangerouslySetInnerHTML"),
    );
    expect(
      xssViolation,
      `Expected dangerouslySetInnerHTML ban. Got: ${JSON.stringify(results[0].messages.map((m) => ({ ruleId: m.ruleId, msg: m.message })))}`,
    ).toBeTruthy();
  });

  it("src/ lints with 0 errors", async () => {
    const results = await eslint.lintFiles(["src"]);
    const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
    expect(errorCount).toBe(0);
  });

  it(".prettierrc has required formatting rules", () => {
    const rc = JSON.parse(readFileSync(".prettierrc", "utf8"));
    expect(rc.singleQuote).toBe(true);
    expect(rc.semi).toBe(true);
    expect(rc.printWidth).toBe(100);
  });
});
