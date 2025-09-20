// tests/specs/responsive-design.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestData } from "../data/test-data";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Responsive Design Tests", () => {
  test("should display correctly on mobile devices", async ({
    page,
    menuPage,
  }) => {
    await page.setViewportSize(TestData.viewports.mobile);
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    // Check mobile navigation
    const mobileNav = page.locator(
      '.mobile-nav, [data-testid="mobile-nav"], .hamburger, button[aria-label*="menu"]'
    );
    if ((await mobileNav.count()) > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }

    // Menu items should stack vertically
    const itemsCount = await menuPage.getMenuItemsCount();
    if (itemsCount >= 2) {
      const firstItem = await menuPage.getMenuItemByIndex(0);
      const secondItem = await menuPage.getMenuItemByIndex(1);

      const firstBox = await firstItem.getBoundingBox();
      const secondBox = await secondItem.getBoundingBox();

      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 50);
      }
    }
  });

  test("should work correctly on tablet devices", async ({
    page,
    menuPage,
  }) => {
    await page.setViewportSize(TestData.viewports.tablet);
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    // Should display in grid layout
    await expect(menuPage.menuGrid).toBeVisible();

    // Test touch interactions
    const firstItem = await menuPage.getFirstMenuItem();
    await firstItem.element.tap();
  });

  test("should maintain functionality on large desktop screens", async ({
    page,
    menuPage,
  }) => {
    await page.setViewportSize(TestData.viewports.largeDesktop);
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    // Should show multiple columns
    const itemsCount = await menuPage.getMenuItemsCount();
    if (itemsCount >= 3) {
      const firstItem = await menuPage.getMenuItemByIndex(0);
      const thirdItem = await menuPage.getMenuItemByIndex(2);

      const firstBox = await firstItem.getBoundingBox();
      const thirdBox = await thirdItem.getBoundingBox();

      if (firstBox && thirdBox) {
        const heightDifference = Math.abs(thirdBox.y - firstBox.y);
        expect(heightDifference).toBeLessThan(100);
      }
    }
  });

  test("should maintain consistent styling across devices", async ({
    page,
    menuPage,
  }) => {
    const viewports = [
      TestData.viewports.mobile,
      TestData.viewports.tablet,
      TestData.viewports.desktop,
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await menuPage.goto();
      await menuPage.waitForMenuItemsToLoad();

      const firstItem = await menuPage.getFirstMenuItem();
      await expect(firstItem.element).toBeVisible();
      await expect(firstItem.name).toBeVisible();
      await expect(firstItem.price).toBeVisible();
    }
  });

  test("should handle orientation changes on mobile", async ({
    page,
    menuPage,
  }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    const portraitItemCount = await menuPage.getMenuItemsCount();

    // Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await menuPage.waitForMenuItemsToLoad();

    const landscapeItemCount = await menuPage.getMenuItemsCount();
    expect(landscapeItemCount).toBe(portraitItemCount);
  });
});
