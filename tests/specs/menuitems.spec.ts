import { test, expect } from "../fixtures/test-fixtures";
import { TestHelpers } from "../utils/test-helpers";

// test("should locate and test individual menu items", async ({ page }) => {
//   await TestHelpers.ensurePageReady(page);
//   await page.goto("https://www.greggs.com/menu");
//   // Wait for potential cookie banner
//   await page.waitForTimeout(6000);

//   const cookieBannerBanner = page
//     .locator('[class*="cookie"], [id*="cookie"]')
//     .first();

//   if (await cookieBannerBanner.isVisible({ timeout: 2000 })) {
//     // First try reject
//     const rejectButton = page
//       .locator('button:has-text("Reject"), button:has-text("Decline")')
//       .first();
//     if (await rejectButton.isVisible({ timeout: 1000 })) {
//       await rejectButton.click();
//       await page.waitForTimeout(500);
//     }
//   }

//   //   await page.goto("/menu");
//   //   await page.waitForSelector("a[data-test-card]");

//   //await page.waitForLoadState("networkidle");

//   // Get all menu items
//   // Collect menu item names and URLs first to avoid stale element references
//   const menuItemElements = await page.locator("a[data-test-card]").all();
//   console.log(`Found ${menuItemElements.length} menu items`);

//   const menuItems: { name: string; url: string }[] = [];
//   for (const item of menuItemElements) {
//     const itemName = await item.locator("h3").textContent();
//     const itemUrl = await item.getAttribute("href");
//     if (itemName && itemUrl) {
//       menuItems.push({ name: itemName.trim(), url: itemUrl });
//       console.log(`Menu item: ${itemName.trim()} - ${itemUrl}`);
//     }
//   }

//   // Loop through each menu item and check the names
//   const results: {
//     name: string;
//     url: string;
//     passed: boolean;
//     actualH1?: string;
//   }[] = [];
//   for (const { name, url } of menuItems) {
//     const fullUrl = url.startsWith("/") ? `https://www.greggs.com${url}` : url;
//     // Wrap the await calls in an async IIFE to ensure proper async context
//     await (async () => {
//       await page.goto(fullUrl);
//       await page.waitForSelector("h1", { state: "visible", timeout: 5000 });

//       // Verify that the H1 text matches the menu item's name
//       const h1Locator = page.locator("h1");
//       await h1Locator.waitFor({ state: "visible", timeout: 5000 });
//       const h1Text = await h1Locator.textContent();
//       const passed = h1Text?.trim() === name;
//       results.push({ name, url, passed, actualH1: h1Text?.trim() });
//       expect(h1Text?.trim()).toBe(name);
//     })();
//   }

//   // Log test results
//   console.log("Menu item test results:");
//   results.forEach(({ name, url, passed, actualH1 }) => {
//     console.log(
//       `Name: ${name}, URL: ${url}, Passed: ${passed}, Actual H1: ${actualH1}`
//     );
//   });
//   // Test finished
//   // Verify navigation or modal opened
// });
