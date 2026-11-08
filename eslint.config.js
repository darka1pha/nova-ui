import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**", "**/playwright-report/**", "**/test-results/**", "**/vendor/**", "**/.next/**", "**/next-env.d.ts", "local-packages/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // React Compiler rules (react-hooks v7) as warnings: they flag existing
      // patterns (latest-value refs read in render, setState in effects) that
      // work today but block compiler optimisation. Fix them, then raise to "error".
      ...Object.fromEntries(Object.keys(reactHooks.configs["recommended-latest"].rules).map((rule) => [rule, "warn"])),
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  {
    files: ["**/tests/**", "**/e2e/**"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
);
