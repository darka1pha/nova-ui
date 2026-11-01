import { defineConfig, devices } from "@playwright/test";

// Runs against the production build of the docs (`vite build` + `vite preview`),
// which consumes @darkalpha/nova-ui from its published dist/ output.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Half the cores: full parallelism starves the preview server and causes timeouts.
  workers: process.env.CI ? 2 : "50%",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  expect: {
    timeout: 15_000,
    // Tight enough to catch a token change (e.g. a subtle fill one step darker).
    toHaveScreenshot: { maxDiffPixelRatio: 0.001, threshold: 0.05, animations: "disabled" },
  },
  // Screenshots differ slightly by OS font rendering; baselines are per-platform.
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: "pnpm exec vite build && pnpm exec vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
