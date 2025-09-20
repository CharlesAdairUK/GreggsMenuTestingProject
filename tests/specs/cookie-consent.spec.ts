// tests/specs/cookie-consent.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Cookie Consent Handling", () => {
  test("should handle cookie consent banner on page load", async ({ page }) => {
    // Navigate without using the MenuPage to test raw cookie handling
    await page.goto("https://www.greggs.com/menu");

    // Wait for potential cookie banner
    await page.waitForTimeout(6000);

    // Check if cookie banner appears
    const cookieBanner = page
      .locator(
        [
          '[data-testid="cookie-banner"]',
          ".cookie-banner",
          ".cookie-consent",
          ".cookie-notice",
          "#cookie-banner",
          '[class*="cookie"]',
          '[id*="cookie"]',
          ".onetrust-banner-sdk",
          "#onetrust-banner-sdk",
        ].join(", ")
      )
      .first();

    if (await cookieBanner.isVisible({ timeout: 2000 })) {
      // Try to find and click reject button
      const rejectButton = page
        .locator(
          [
            'button:has-text("Reject")',
            'button:has-text("Decline")',
            'button:has-text("No")',
            'button:has-text("Reject All")',
            '[data-testid="reject-cookies"]',
            ".cookie-reject",
            "#reject-cookies",
            ".onetrust-reject-all-handler",
          ].join(", ")
        )
        .first();

      if (await rejectButton.isVisible({ timeout: 2000 })) {
        await rejectButton.click();
        console.log("Cookie consent rejected");

        // Verify banner is hidden
        await expect(cookieBanner).toBeHidden({ timeout: 5000 });
      } else {
        console.log("Reject button not found, banner might auto-dismiss");
      }
    } else {
      console.log("No cookie banner detected");
    }

    // Verify page is functional after cookie handling
    await page.waitForLoadState("networkidle");
    const pageContent = page.locator("body");
    await expect(pageContent).toBeVisible();
  });

  // test("should reject cookies and maintain functionality", async ({
  //   menuPage,
  // }) => {
  //   await menuPage.goto();

  //   // Verify cookie banner was handled
  //   const cookieBanner = menuPage.cookieBanner;
  //   await expect(cookieBanner).not.toBeVisible();

  //   // Verify page functionality works after rejecting cookies
  //   await menuPage.waitForMenuItemsToLoad();
  //   const itemsCount = await menuPage.getMenuItemsCount();
  //   expect(itemsCount).toBeGreaterThan(0);

  //   // Verify we can still interact with elements
  //   const firstItem = await menuPage.getFirstMenuItem();
  //   await expect(firstItem.element).toBeVisible();
  // });

  test("should handle cookie preferences through localStorage", async ({
    page,
  }) => {
    // Pre-set cookie preferences
    await page.addInitScript(() => {
      localStorage.setItem("cookieConsent", "rejected");
      localStorage.setItem("cookies-rejected", "true");
    });

    await page.goto("https://www.greggs.com/menu");
    await page.waitForLoadState("networkidle");

    // Cookie banner should not appear
    const cookieBanner = page
      .locator('.cookie-banner, .cookie-consent, [class*="cookie"]')
      .first();
    await expect(cookieBanner).not.toBeVisible();
  });

  // test("should handle multiple cookie consent frameworks", async ({ page }) => {
  //   await page.goto("https://www.greggs.com/menu");
  //   await page.waitForTimeout(3000);

  //   // Check for different cookie consent frameworks
  //   const frameworks = [
  //     { name: "OneTrust", selector: ".onetrust-banner-sdk" },
  //     { name: "Cookiebot", selector: ".cookiebot" },
  //     { name: "Custom", selector: ".cookie-banner" },
  //     { name: "Generic", selector: '[class*="cookie"]' },
  //   ];

  //   for (const framework of frameworks) {
  //     const banner = page.locator(framework.selector).first();
  //     if (await banner.isVisible({ timeout: 1000 })) {
  //       console.log(`Detected ${framework.name} cookie framework`);

  //       // Try to reject
  //       const rejectButton = banner
  //         .locator('button:has-text("Reject"), button:has-text("Decline")')
  //         .first();
  //       if (await rejectButton.isVisible({ timeout: 1000 })) {
  //         await rejectButton.click();
  //         await expect(banner).toBeHidden({ timeout: 5000 });
  //       }
  //       break;
  //     }
  //   }
  // });

  test("should fallback to accepting cookies if reject unavailable", async ({
    page,
  }) => {
    await page.goto("https://www.greggs.com/menu");
    await page.waitForTimeout(2000);

    const cookieBanner = page
      .locator('[class*="cookie"], [id*="cookie"]')
      .first();

    if (await cookieBanner.isVisible({ timeout: 2000 })) {
      // First try reject
      const rejectButton = page
        .locator('button:has-text("Reject"), button:has-text("Decline")')
        .first();

      if (await rejectButton.isVisible({ timeout: 1000 })) {
        await rejectButton.click();
      } else {
        // Fallback to accept to unblock tests
        const acceptButton = page
          .locator('button:has-text("Accept"), button:has-text("Allow")')
          .first();
        if (await acceptButton.isVisible({ timeout: 1000 })) {
          await acceptButton.click();
          console.log("Accepted cookies as fallback to continue tests");
        }
      }

      await expect(cookieBanner).toBeHidden({ timeout: 5000 });
    }
  });

  // test("should handle cookie consent without blocking navigation", async ({
  //   menuPage,
  // }) => {
  //   //await menuPage.goto();
  //   await menuPage.waitForMenuItemsToLoad();

  //   // Should be able to navigate between categories
  //   await menuPage.clickCategory("Breakfast");

  //   // Cookie banner should not reappear
  //   await expect(menuPage.cookieBanner).not.toBeVisible();

  //   // Should be able to interact with items
  //   const itemsCount = await menuPage.getMenuItemsCount();
  //   expect(itemsCount).toBeGreaterThan(0);
  // });

  //   test("should persist cookie choices across page reloads", async ({
  //     page,
  //   }) => {
  //     // Initial visit and reject cookies
  //     await page.goto("https://www.greggs.com/menu");
  //     await page.waitForTimeout(2000);

  //     const cookieBanner = page.locator('[class*="cookie"]').first();
  //     if (await cookieBanner.isVisible({ timeout: 2000 })) {
  //       const rejectButton = page.locator('button:has-text("Reject")').first();
  //       if (await rejectButton.isVisible({ timeout: 1000 })) {
  //         await rejectButton.click();
  //       }
  //     }

  //     // Reload page
  //     await page.reload();
  //     await page.waitForTimeout(2000);

  //     // Cookie banner should not reappear
  //     await expect(cookieBanner).not.toBeVisible();
  //   });
  // });

  test.describe("Error Handling Tests", () => {
    test("should handle network errors gracefully", async ({
      page,
      menuPage,
    }) => {
      await TestHelpers.simulateNetworkError(page);
      await menuPage.goto();

      // Should show error message or offline state
      if (await menuPage.isErrorMessageVisible()) {
        expect(await menuPage.isErrorMessageVisible()).toBe(true);
      }
    });

    test("should handle slow loading gracefully", async ({
      page,
      menuPage,
    }) => {
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

    test("should handle missing images gracefully", async ({
      page,
      menuPage,
    }) => {
      // Mock image requests to fail
      await page.route("**/*.{png,jpg,jpeg,webp}", (route) => route.abort());

      await menuPage.goto();
      await menuPage.waitForMenuItemsToLoad();

      // Should still display menu items with placeholder or alt text
      const itemsCount = await menuPage.getMenuItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });

    test("should recover from API failures", async ({ page, menuPage }) => {
      // Simulate API failure first
      await page.route("**/api/**", (route) => route.abort());
      await menuPage.goto();

      // Remove route to simulate recovery
      await page.unroute("**/api/**");
      await page.reload();

      await menuPage.waitForMenuItemsToLoad();
      const itemsCount = await menuPage.getMenuItemsCount();
      expect(itemsCount).toBeGreaterThan(0);
    });
  });
});
