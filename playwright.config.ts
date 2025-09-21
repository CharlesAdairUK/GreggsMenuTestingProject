// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/specs",
  fullyParallel: true,
  timeout: 130000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    headless: false,
    extraHTTPHeaders: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  },

  // Global setup for cookie handling
  globalSetup: require.resolve("./tests/utils/global-setup.ts"),

  projects: [
    {
      name: "Setup & Cookie Handling",
      testMatch: "**/cookie-consent.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["Setup & Cookie Handling"],
    },
    {
      name: "Desktop Firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["Setup & Cookie Handling"],
    },
    {
      name: "Desktop Safari",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["Setup & Cookie Handling"],
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["Setup & Cookie Handling"],
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      dependencies: ["Setup & Cookie Handling"],
    },
    {
      name: "Tablet",
      use: { ...devices["iPad Pro"] },
      dependencies: ["Setup & Cookie Handling"],
    },
  ],

  // webServer: {
  //   command: "npm run start-test-server",
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
