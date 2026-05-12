/**
 * Lighthouse CI configuration (WO-046).
 *
 * LHCI runs against the local `dist/` build served by the built-in static
 * server so we never hit the deployed site. Keep `numberOfRuns` at 1 for
 * speed; increase to 3 if score variance becomes a problem.
 *
 * Thresholds (PRD success metrics):
 *   Performance  ≥ 90
 *   Accessibility ≥ 90
 *   Best Practices ≥ 85
 *
 * @type {import('@lhci/cli').LighthouseConfig}
 */
export default {
  ci: {
    collect: {
      staticDistDir: "./dist",
      numberOfRuns: 1,
      settings: {
        // Desktop preset matches the primary game resolution (1280 px viewport).
        // The game is also playable on mobile but desktop represents the PRD
        // "performance ≥ 90" target.
        preset: "desktop",
        // Throttling disabled on CI runners — they have predictable CPU, so
        // simulated throttling skews performance scores unpredictably.
        throttlingMethod: "provided",
        throttling: {
          cpuSlowdownMultiplier: 1,
          rttMs: 0,
          throughputKbps: 0,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
      },
    },
    upload: {
      // Save reports to the local filesystem for artifact upload.
      // Set LHCI_TOKEN to upload to a remote LHCI server instead.
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
