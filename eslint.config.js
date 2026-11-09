import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/generated/**", "**/playwright-report/**", "**/test-results/**", "**/vendor/**", "**/.next/**", "**/next-env.d.ts", "local-packages/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      // React Compiler rules (react-hooks v7). Latest-value refs go through
      // useLatestRef (utils/use-latest-ref.ts), not assignments during render;
      // state that follows a prop is adjusted during render, not in an effect.
      // Genuine exceptions carry an eslint-disable comment saying why.
      ...Object.fromEntries(Object.keys(reactHooks.configs["recommended-latest"].rules).map((rule) => [rule, "error"])),
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  // Static a11y checks on JSX, alongside the axe unit tests and Playwright.
  { files: ["**/*.{tsx,jsx}"], ...jsxA11y.flatConfigs.recommended },
  {
    files: ["**/*.{tsx,jsx}"],
    rules: {
      // `role` is also a plain prop on some components (KavehContactCard's job title).
      "jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }],
      // Scrollable regions must be focusable (axe: scrollable-region-focusable), and
      // charts and resize handles are keyboard widgets on group/separator roles.
      "jsx-a11y/no-noninteractive-tabindex": ["error", { tags: ["pre"], roles: ["tabpanel", "region", "log", "group", "separator"], allowExpressionValues: true }],
      "jsx-a11y/label-has-associated-control": ["error", { controlComponents: ["Input", "Textarea", "SelectTrigger"], depth: 3 }],
    },
  },
  {
    files: ["**/tests/**", "**/e2e/**"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
);
