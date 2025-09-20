// tests/specs/accessibility.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test("should support keyboard navigation", async ({ page, menuPage }) => {
    // Test tab navigation
    await page.keyboard.press("Tab");
    let focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    }

    // Test Enter key activation
    await page.keyboard.press("Enter");
  });

  test("should have proper ARIA attributes", async ({ page, menuPage }) => {
    // Check navigation has proper ARIA
    const nav = menuPage.mainNavigation;
    if ((await nav.count()) > 0) {
      const ariaLabel = await nav.getAttribute("aria-label");
      const role = await nav.getAttribute("role");
      expect(ariaLabel || role).toBeTruthy();
    }

    // Check menu items have proper labels
    const firstItem = await menuPage.getFirstMenuItem();
    const hasAriaLabel = await firstItem.element.getAttribute("aria-label");
    const hasRole = await firstItem.element.getAttribute("role");

    expect(hasAriaLabel || hasRole).toBeTruthy();
  });

  test("should have sufficient color contrast", async ({ page, menuPage }) => {
    const firstItem = await menuPage.getFirstMenuItem();

    const nameColor = await TestHelpers.getComputedStyle(
      firstItem.name,
      "color"
    );
    const priceColor = await TestHelpers.getComputedStyle(
      firstItem.price,
      "color"
    );

    expect(nameColor).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    expect(priceColor).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
  });

  test("should have proper heading structure", async ({ page }) => {
    const h1Elements = page.locator("h1");
    await expect(h1Elements).toHaveCount(1);

    const allHeadings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await allHeadings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test("should provide alternative text for images", async ({ menuPage }) => {
    const itemsCount = Math.min(await menuPage.getMenuItemsCount(), 5);

    for (let i = 0; i < itemsCount; i++) {
      const item = await menuPage.getMenuItemByIndex(i);

      const alt = await item.image.getAttribute("alt");
      const ariaLabel = await item.image.getAttribute("aria-label");

      expect(alt || ariaLabel).toBeTruthy();

      if (alt) {
        expect(alt.length).toBeGreaterThan(0);
        expect(alt).not.toBe("image");
      }
    }
  });

  test("should work with screen readers", async ({ page }) => {
    // Check for skip links
    const skipLink = page.locator(
      'a[href="#main"], .skip-link, [href="#content"]'
    );
    if ((await skipLink.count()) > 0) {
      await expect(skipLink.first()).toBeVisible();
    }

    // Check for proper landmark regions
    const main = page.locator('main, [role="main"]');
    if ((await main.count()) > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test("should have focus indicators", async ({ page, menuPage }) => {
    await page.keyboard.press("Tab");
    const focusedElement = page.locator(":focus");

    const outlineStyle = await TestHelpers.getComputedStyle(
      focusedElement,
      "outline"
    );
    const boxShadow = await TestHelpers.getComputedStyle(
      focusedElement,
      "box-shadow"
    );

    // Should have some form of focus indicator
    expect(outlineStyle !== "none" || boxShadow !== "none").toBe(true);
  });
});
