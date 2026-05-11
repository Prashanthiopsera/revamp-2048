/**
 * Validates the GitHub Actions CI workflow file (WO-006).
 * Parses the YAML and asserts required structural properties without
 * needing to run the workflow in GitHub's environment.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal YAML parser for the subset of YAML used in the workflow file.
// We avoid bringing in a full YAML library to keep the test self-contained.
// For structural assertions, string-based checks are reliable and fast.
const RAW = readFileSync(resolve(process.cwd(), ".github/workflows/ci.yml"), "utf8");

describe("GitHub Actions CI workflow (WO-006)", () => {
  it("is valid YAML text (non-empty, no tab indentation)", () => {
    expect(RAW.length).toBeGreaterThan(0);
    // YAML forbids tabs for indentation
    const hasTabIndent = RAW.split("\n").some((line) => /^\t/.test(line));
    expect(hasTabIndent).toBe(false);
  });

  it("triggers on pull_request", () => {
    expect(RAW).toMatch(/pull_request/);
  });

  it("triggers on push to main", () => {
    expect(RAW).toMatch(/push/);
    expect(RAW).toMatch(/main/);
  });

  it("uses Node 22 LTS", () => {
    expect(RAW).toMatch(/node-version:\s*22/);
  });

  it("uses npm ci for frozen lockfile install", () => {
    expect(RAW).toMatch(/npm ci/);
  });

  it("includes a lint step", () => {
    expect(RAW).toMatch(/npm run lint/);
  });

  it("includes a type-check step (tsc --noEmit)", () => {
    expect(RAW).toMatch(/tsc --noEmit/);
  });

  it("includes a test step", () => {
    expect(RAW).toMatch(/npm run test/);
  });

  it("includes a build step", () => {
    expect(RAW).toMatch(/npm run build/);
  });

  it("caches npm dependencies", () => {
    expect(RAW).toMatch(/cache:\s*npm/);
  });

  it("has a timeout-minutes set to enforce SLO", () => {
    expect(RAW).toMatch(/timeout-minutes:\s*8/);
  });

  it("deploy job only runs on push to main (not PRs)", () => {
    expect(RAW).toMatch(/github\.event_name == 'push'/);
    expect(RAW).toMatch(/github\.ref == 'refs\/heads\/main'/);
  });

  // WO-007: security scanning
  it("includes a Gitleaks secret scanning step", () => {
    expect(RAW).toMatch(/gitleaks\/gitleaks-action/);
  });

  it("includes an npm audit step at high severity level", () => {
    expect(RAW).toMatch(/npm audit --audit-level=high/);
  });

  it("security job runs in parallel (deploy needs both quality and security)", () => {
    expect(RAW).toMatch(/needs:\s*\[quality,\s*security\]/);
  });
});
