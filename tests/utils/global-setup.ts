// tests/utils/global-setup.ts
import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("Running global setup for cookie handling...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Visit the site and handle cookies once globally
    await page.goto("https://www.greggs.com/menu");
    await page.waitForTimeout(3000);

    // Handle cookie consent
    const cookieBanner = page
      .locator(
        [
          ".cookie-banner",
          ".cookie-consent",
          '[class*="cookie"]',
          ".onetrust-banner-sdk",
        ].join(", ")
      )
      .first();

    if (await cookieBanner.isVisible({ timeout: 5000 })) {
      console.log("Cookie banner detected in global setup");

      const rejectButton = page
        .locator(
          [
            'button:has-text("Reject")',
            'button:has-text("Decline")',
            '[data-testid="reject-cookies"]',
            ".onetrust-reject-all-handler",
          ].join(", ")
        )
        .first();

      if (await rejectButton.isVisible({ timeout: 2000 })) {
        await rejectButton.click();
        console.log("Cookies rejected in global setup");
        await cookieBanner.waitFor({ state: "hidden", timeout: 5000 });
      } else {
        console.log("Reject button not found in global setup");
      }
    } else {
      console.log("No cookie banner in global setup");
    }

    // Save the storage state for reuse
    await page.context().storageState({ path: "storage-state.json" });
    console.log("Storage state saved");
  } catch (error) {
    console.log("Global setup cookie handling failed:", error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
