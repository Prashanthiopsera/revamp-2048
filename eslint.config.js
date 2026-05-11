import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Ignore build output and dependencies
  { ignores: ["dist", "node_modules"] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript strict rules applied to all TS/TSX files
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Enforce all React Hooks rules (WO-004 requirement)
      ...reactHooks.configs.recommended.rules,

      // Warn when non-component exports are present in a file with components
      // (helps tree-shaking and HMR reliability during development)
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Prefer explicit return types for public module-level functions
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Consistent type imports keep the bundle clean when isolatedModules is on
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Disallow dangerouslySetInnerHTML to prevent XSS (WO-043 prerequisite)
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML is banned — use safe DOM APIs or sanitize input before rendering.",
        },
      ],
    },
  },

  // Prettier must be last so it disables any style rules that conflict with formatting
  prettierConfig,
);
