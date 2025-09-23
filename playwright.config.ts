// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const IS_CI = process.env.CI === "true";

export default defineConfig({
  testDir: "./tests/specs",
  fullyParallel: true,
  timeout: 130000,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/test-results.json" }],
    ["junit", { outputFile: "test-results/test-results.xml" }],
  ],

  use: {
    baseURL: "https://www.greggs.com/menu",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 130000,
    extraHTTPHeaders: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    }
  ],
});
