import security from "eslint-plugin-security";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: {
      security,
    },
    rules: {
      // Allow underscore-prefixed unused vars (standard convention for intentionally unused params)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prevent eval and similar dangerous constructs
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-possible-timing-attacks": "warn",
      // Detect unsafe regex
      "security/detect-unsafe-regex": "error",
      // Prevent child_process with user input
      "security/detect-child-process": "warn",
      // No hardcoded credentials
      "security/detect-no-csrf-before-method-override": "error",
      // Buffer allocation safety
      "security/detect-buffer-noassert": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "e2e/**",
      "*.config.{js,mjs,ts}",
    ],
  },
];
