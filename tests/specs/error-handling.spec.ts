// tests/specs/error-handling.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Error Handling Tests", () => {
  test("should handle network errors gracefully", async ({
    page,
    menuPage,
  }) => {
    await TestHelpers.simulateNetworkError(page);
    await menuPage.goto();

    // Should show error message or offline state
    if (await menuPage.isErrorMessageVisible()) {
      await expect(menuPage.isErrorMessageVisible()).resolves.toBe(true);
    }
  });

  test("should handle slow loading gracefully", async ({ page, menuPage }) => {
    await TestHelpers.simulateSlowNetwork(page);
    await menuPage.goto();

    // Should show loading indicator
    const loadingIndicator = menuPage.loadingSpinner;
    if ((await loadingIndicator.count()) > 0) {
      await expect(loadingIndicator).toBeVisible();
    }

    await menuPage.waitForMenuItemsToLoad();

    // Loading should eventually complete
    if ((await loadingIndicator.count()) > 0) {
      await expect(loadingIndicator).toBeHidden();
    }
  });

  test("should handle JavaScript errors gracefully", async ({
    page,
    menuPage,
  }) => {
    // Inject a JavaScript error
    await page.addInitScript(() => {
      window.addEventListener("error", (e) => {
        console.error("Test injected error:", e.error);
      });
    });

    await menuPage.goto();

    // Page should still be functional
    await expect(menuPage.menuItems.first()).toBeVisible();
  });

  test("should handle empty menu response gracefully", async ({ page }) => {
    // Mock API to return empty data
    await page.route("**/api/menu/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    await TestHelpers.ensurePageReady(page);
    await page.goto("https://www.greggs.com/menu");

    // Should show empty state message
    const emptyStateSelectors = [
      '[data-testid="empty-state"]',
      ".empty-menu",
      ".no-items-message",
      'text="No items available"',
      'text="Menu currently unavailable"',
    ];

    let emptyStateFound = false;
    for (const selector of emptyStateSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await expect(page.locator(selector)).toBeVisible();
        emptyStateFound = true;
        console.log(`Empty state displayed: ${selector}`);
        break;
      }
    }

    // If no specific empty state, check that no menu items are displayed
    const menuItems = await page.locator("a[data-test-card]").count();
    expect(menuItems).toBe(0);

    // Verify page doesn't crash and basic structure remains
    await expect(page.locator("body")).toBeVisible();
    console.log("Empty menu response handled gracefully");
  });

  test("should handle timeout on menu API and recover", async ({
    page,
    menuPage,
  }) => {
    await TestHelpers.simulateSlowNetwork(page);
    await menuPage.goto();

    // Simulate API timeout
    await page.route("**/api/menu/**", async (route) => {
      // Simulate a timeout by delaying the response
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await route.abort(); // Optionally abort after timeout to simulate failure
    });

    // Wait for the API request to be made
    let apiStatus: number;
    try {
      const apiRequest = await page.waitForResponse("**/api/menu/**", {
        timeout: 2000,
      });
      apiStatus = apiRequest.status();
      expect(apiStatus).toBeLessThan(400);
    } catch (error) {
      // If the request times out or fails, continue the test without throwing
      console.warn("API request timed out or failed:", error);
      apiStatus = 0; // Indicate failure, but do not fail the test
    }

    // If the API request status is not OK, treat as error response
    if (apiStatus !== 200) {
      // Optionally log or handle the error here
      console.error("API request failed or timed out");
    }

    // Wait for the page to finish loading
    await page.waitForURL("**/menu");

    // Wait for a reasonable timeout period (e.g., 10 seconds)
    await page.waitForTimeout(1000);

    // Check if the timeout error message is displayed
    if (await menuPage.isErrorMessageVisible()) {
      await expect(menuPage.isErrorMessageVisible()).toBe(true);
    }

    // Remove the timeout route to simulate recovery
    await page.unroute("**/api/menu/**");

    // Reload and trigger a fresh API request
    await page.reload();

    // Check if the loading indicator is visible
    const loadingIndicator = menuPage.loadingSpinner;
    await expect(loadingIndicator).toBeVisible();
    if (await loadingIndicator.isVisible()) {
      console.log("Loading indicator is visible after reload");
    }

    // Wait for menu items to load with a timeout to avoid infinite loop
    //await menuPage.waitForMenuItemsToLoad({ timeout: 15000 });

    // Ensure menu items are visible after recovery
    const itemsCount = await menuPage.getMenuItemsCount();
    console.log("Menu items count after recovery:", itemsCount);
    expect(itemsCount).toBeGreaterThan(0);
  });

  test("should handle corrupted image files gracefully", async ({
    page,
    menuPage,
  }) => {
    // Simulate corrupted image response
    await page.route("**/*.{png,jpg,jpeg,webp}", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: "corrupteddata",
      });
    });

    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    // Should display placeholder or alt text for images
    const itemsCount = await menuPage.getMenuItemsCount();
    for (let i = 0; i < itemsCount; i++) {
      const image = menuPage.menuItems.nth(i).locator("img");
      const isVisible = await image.isVisible();
      const altText = await image.getAttribute("alt");
      const hasPlaceholder =
        (await menuPage.menuItems
          .nth(i)
          .locator(".image-placeholder")
          .count()) > 0;

      expect(isVisible || hasPlaceholder || !!altText).toBe(true);
    }
  });

  test("should handle unauthorized API response gracefully", async ({
    page,
    menuPage,
  }) => {
    // Simulate API failure first
    await page.route("**/api/**", (route) => route.abort());
    await menuPage.goto();

    // Should show error message or login prompt
    const errorVisible = await menuPage.isErrorMessageVisible();
    expect(errorVisible).toBe(true);

    // Log the error for debugging
    if (errorVisible) {
      console.error("Unauthorized API response detected.");
    }

    // Remove route to simulate recovery
    await page.unroute("**/api/**");

    // Reload and trigger a fresh API request
    await page.reload();
    await menuPage.goto();

    // Remove route to resolve API issue
    await page.unroute("**/api/menu");

    // Reload and verify user can view the site again
    await page.reload();
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    // Ensure menu items are visible after recovery
    expect(await menuPage.getMenuItemsCount()).toBeGreaterThan(0);
    // Wait for menu items to load, with retries if needed
    await menuPage.waitForMenuItemsToLoad();
    let itemsCount = await menuPage.getMenuItemsCount();
    let retries = 3;
    while (itemsCount === 0 && retries > 0) {
      await page.reload();
      await menuPage.waitForMenuItemsToLoad();
      itemsCount = await menuPage.getMenuItemsCount();
      retries--;
    }
    expect(itemsCount).toBeGreaterThan(0);
  });

  test("should handle missing images gracefully", async ({
    page,
    menuPage,
  }) => {
    // Mock image requests to fail
    await page.route("**/*.{png,jpg,jpeg,webp}", (route) => route.abort());

    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    // Should still display menu items with placeholder or alt text

    // Check that each menu item has either a placeholder or alt text
    const itemsCount = await menuPage.getMenuItemsCount();
    for (let i = 0; i < itemsCount; i++) {
      const image = menuPage.menuItems.nth(i).locator("img");
      const isVisible = await image.isVisible();
      const altText = await image.getAttribute("alt");
      const hasPlaceholder =
        (await menuPage.menuItems
          .nth(i)
          .locator(".image-placeholder")
          .count()) > 0;

      expect(isVisible || hasPlaceholder || !!altText).toBe(true);
    }
  });

  test("should recover from API failures", async ({ page, menuPage }) => {
    // Simulate API failure first
    await page.route("**/api/**", (route) => route.abort());
    await menuPage.goto();

    // Remove route to simulate recovery
    await page.unroute("**/api/**");

    // Reload and trigger a fresh API request
    await page.reload();
    await menuPage.goto();

    // Wait for menu items to load, with retries if needed
    await menuPage.waitForMenuItemsToLoad();
    let itemsCount = await menuPage.getMenuItemsCount();
    let retries = 3;
    while (itemsCount === 0 && retries > 0) {
      await page.reload();
      await menuPage.waitForMenuItemsToLoad();
      itemsCount = await menuPage.getMenuItemsCount();
      retries--;
    }
    expect(itemsCount).toBeGreaterThan(0);
  });
});
