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

import { ESLint } from "eslint";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";

const eslint = new ESLint();
const FIXTURE_DIR = new URL("src/", import.meta.url).pathname;

function writeFixture(name, code) {
  const path = join(FIXTURE_DIR, name);
  writeFileSync(path, code, "utf8");
  return path;
}

function removeFixture(path) {
  try {
    unlinkSync(path);
  } catch {
    // Ignore cleanup errors
  }
}

async function testConfigLoads() {
  const cfg = await eslint.calculateConfigForFile("src/main.tsx");
  assert.ok(cfg, "Config should resolve for a .tsx file");
  console.log("  ✓ eslint.config.js loads without errors");
}

async function testReactHooksRuleEnabled() {
  // Calling a hook inside a regular function (not a component or custom hook) is a
  // Rules of Hooks violation that react-hooks/rules-of-hooks must catch.
  const code = `
import { useState } from "react";

function notAComponent() {
  const [x, setX] = useState(0);
  return x;
}

export default notAComponent;
`;
  const path = writeFixture("__hooks_violation_fixture__.tsx", code);
  try {
    const results = await eslint.lintFiles([path]);
    const result = results[0];
    const hookViolation = result.messages.find((m) =>
      m.ruleId?.includes("react-hooks/rules-of-hooks"),
    );
    assert.ok(
      hookViolation,
      `react-hooks/rules-of-hooks should flag a hook called inside a regular function. Got messages: ${JSON.stringify(result.messages.map((m) => m.ruleId))}`,
    );
    console.log("  ✓ react-hooks/rules-of-hooks flags violations correctly");
  } finally {
    removeFixture(path);
  }
}

async function testDangerouslySetInnerHTMLBanned() {
  const code = `
export function Unsafe() {
  return <div dangerouslySetInnerHTML={{ __html: "<b>hi</b>" }} />;
}
`;
  const path = writeFixture("__xss_violation_fixture__.tsx", code);
  try {
    const results = await eslint.lintFiles([path]);
    const result = results[0];
    const xssViolation = result.messages.find(
      (m) =>
        m.ruleId === "no-restricted-syntax" && m.message.includes("dangerouslySetInnerHTML"),
    );
    assert.ok(
      xssViolation,
      `no-restricted-syntax should ban dangerouslySetInnerHTML. Got messages: ${JSON.stringify(result.messages.map((m) => ({ ruleId: m.ruleId, msg: m.message })))}`,
    );
    console.log("  ✓ dangerouslySetInnerHTML is banned by no-restricted-syntax");
  } finally {
    removeFixture(path);
  }
}

async function testCleanSrcLint() {
  // Mirror of `npm run lint` — the real source tree must be error-free.
  const results = await eslint.lintFiles(["src"]);
  const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
  assert.equal(errorCount, 0, `Expected 0 lint errors in src/, got ${errorCount}`);
  console.log("  ✓ src/ lints with 0 errors");
}

async function testPrettierConfigExists() {
  // .prettierrc has no .json extension so we read it directly (import assertions
  // require a .json extension in Node.js ESM).
  const rc = JSON.parse(readFileSync(".prettierrc", "utf8"));
  assert.equal(rc.singleQuote, true, ".prettierrc must set singleQuote: true");
  assert.equal(rc.semi, true, ".prettierrc must set semi: true");
  assert.equal(rc.printWidth, 100, ".prettierrc must set printWidth: 100");
  console.log("  ✓ .prettierrc has required formatting rules");
}

async function runTests() {
  const tests = [
    testConfigLoads,
    testReactHooksRuleEnabled,
    testDangerouslySetInnerHTMLBanned,
    testCleanSrcLint,
    testPrettierConfigExists,
  ];

  let passed = 0;
  let failed = 0;

  console.log("\nESLint config tests (WO-004)\n");

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (err) {
      console.error(`  ✗ ${test.name}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests();
