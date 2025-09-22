// tests/specs/accessibility.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test("should support keyboard navigation", async ({ page }) => {
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
    await TestHelpers.ensurePageReady(page);
    const nav = menuPage.mainNavigation;
    if ((await nav.count()) > 0) {
      const ariaLabel = await nav.getAttribute("aria-label");
      const role = await nav.getAttribute("role");
      if (!ariaLabel) {
        console.warn("Navigation is missing aria-label attribute.");
      }
      if (!role) {
        console.warn("Navigation is missing role attribute.");
      }
      expect(!!(ariaLabel || role)).toBe(true);
    }

    // Check menu items have proper labels
    const menuItemElements = page.locator("a[data-test-card]");
    const count = await menuItemElements.count();
    if (count === 0) {
      throw new Error("No menu items found to check ARIA attributes.");
    }
    for (let i = 0; i < count; i++) {
      const menuItemElement = menuItemElements.nth(i);
      const hasAriaLabel = await menuItemElement.getAttribute("aria-label");
      const hasRole = await menuItemElement.getAttribute("role");
      if (!hasAriaLabel) {
        console.warn(
          `Menu item at index ${i} is missing aria-label attribute.`
        );
      }
      if (!hasRole) {
        console.warn(`Menu item at index ${i} is missing role attribute.`);
      }
      expect(!!(hasAriaLabel || hasRole)).toBe(true);
    }
  });

  test("should have sufficient color contrast for colorblind and visually impaired users", async ({
    page,
  }) => {
    const menuItemElements = page.locator("a[data-test-card]");
    const count = await menuItemElements.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const menuItemElement = menuItemElements.nth(i);
      const nameElement = menuItemElement.locator("[data-test-card-name]");

      // Get colors and backgrounds
      const nameColor = await TestHelpers.getComputedStyle(
        nameElement,
        "color"
      );
      const nameBg = await TestHelpers.getComputedStyle(
        nameElement,
        "background-color"
      );

      // Check color format
      expect(nameColor).toMatch(
        /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d\.]+\s*)?\)/
      );

      // Calculate contrast ratio
      const nameContrast = TestHelpers.getContrastRatio(nameColor, nameBg);

      // WCAG AA minimum contrast ratio for normal text is 4.5:1
      expect(nameContrast).toBeGreaterThanOrEqual(4.5);

      // Check for colorblind-friendly indicators (e.g., icons, patterns)
      const colorblindIndicator = menuItemElement.locator(
        "[data-colorblind-indicator]"
      );
      if ((await colorblindIndicator.count()) > 0) {
        await expect(colorblindIndicator.first()).toBeVisible();
      }
    }
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

      expect(!!(alt || ariaLabel)).toBe(true);

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

  test("should have focus indicators", async ({ page }) => {
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
