/**
 * Bundle size budget checker (WO-045).
 *
 * Reads every .js file from dist/assets/, computes its gzip size, and
 * compares it against the per-chunk budgets defined below. Exits with code 1
 * if any budget is exceeded so CI blocks the deploy.
 *
 * Usage: node scripts/check-bundle-size.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// ---------------------------------------------------------------------------
// Budget definitions
// ---------------------------------------------------------------------------

/**
 * Gzipped size budgets (bytes). A chunk matches a budget when its filename
 * contains the corresponding key string.
 *
 * PRD success metrics:
 *   - Main 2D experience JS:  < 200 KB gzipped
 *   - 3D lazy chunk:          < 300 KB gzipped
 */
const BUDGETS = [
  { label: "Main JS chunk",  match: "index",   maxBytes: 200 * 1024 },
  { label: "3D lazy chunk",  match: "Board3D",  maxBytes: 300 * 1024 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const ASSETS_DIR = join(process.cwd(), "dist", "assets");

let files;
try {
  files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".js"));
} catch {
  console.error(`ERROR: Could not read ${ASSETS_DIR}. Did you run 'npm run build' first?`);
  process.exit(1);
}

if (files.length === 0) {
  console.error("ERROR: No .js files found in dist/assets/. Run 'npm run build' first.");
  process.exit(1);
}

console.log("Bundle size report\n==================");

let anyFailed = false;

for (const budget of BUDGETS) {
  const matching = files.filter((f) => f.includes(budget.match));

  if (matching.length === 0) {
    console.warn(`  WARN: No chunk matching "${budget.match}" found — skipping budget check.`);
    continue;
  }

  for (const file of matching) {
    const raw = readFileSync(join(ASSETS_DIR, file));
    const gzipped = gzipSync(raw);
    const gzSize = gzipped.length;
    const status = gzSize <= budget.maxBytes ? "✓ PASS" : "✗ FAIL";
    const detail = `${formatKB(gzSize)} / budget ${formatKB(budget.maxBytes)}`;

    console.log(`  ${status}  ${budget.label} (${file}): ${detail}`);

    if (gzSize > budget.maxBytes) {
      anyFailed = true;
    }
  }
}

if (anyFailed) {
  console.error(
    "\nBundle budget exceeded — reduce the bundle size before merging.\n" +
    "Open dist/stats.html to analyse module composition.",
  );
  process.exit(1);
} else {
  console.log("\nAll bundle budgets passed.");
}
