import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      "**/.venv/**",
      // Astro 5 parser compatibility issue - temporarily exclude
      "src/layouts/Layout.astro",
    ],
  },
  // JS/TS files
  {
    files: ["**/*.{js,ts}"],
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended,
  // Astro files
  ...astro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    files: ["src/utils/sanitizer.ts"],
    rules: {
      "no-control-regex": "off",
    },
  },
  {
    files: ["public/scripts/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        setTimeout: "readonly",
        HTMLElement: "readonly",
        Image: "readonly",
      },
    },
  },
];
