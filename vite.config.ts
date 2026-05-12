import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * The `VITE_BASE_PATH` environment variable controls the public base path for
 * asset resolution. Set it at build time when deploying to a sub-path on
 * GitHub Pages:
 *
 *   VITE_BASE_PATH=/revamp-2048/ npm run build
 *
 * Omit it (or set it to "/") when deploying to a custom domain or org root.
 * The CI workflow sets this automatically via the GITHUB_REPOSITORY context.
 */
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    // Bundle visualizer — always generates dist/stats.html for CI artifact upload.
    // Open dist/stats.html in a browser to inspect module composition.
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
