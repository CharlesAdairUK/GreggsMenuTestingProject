// tests/specs/menu-navigation.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestData } from "../data/test-data";

test.describe("Menu Navigation Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test("should display all main menu categories", async ({ menuPage }) => {
    const visibleCategories = await menuPage.getAllCategoryNames();

    for (const expectedCategory of TestData.categories) {
      expect(visibleCategories).toContain(expectedCategory);
    }
  });

  test("should navigate to category sections when clicked", async ({
    menuPage,
  }) => {
    await menuPage.clickCategory("Breakfast");

    const breakfastSection = await menuPage.getCategorySection("Breakfast");
    await expect(breakfastSection).toBeVisible();
  });

  test("should maintain active state for current menu section", async ({
    menuPage,
  }) => {
    await menuPage.clickCategory("Savouries & Bakes");

    // Verify category is highlighted or has active state
    const activeCategoryIndicator = menuPage.page.locator(
      '.active, [aria-current="page"], .current'
    );
    await expect(activeCategoryIndicator.first()).toBeVisible();
  });

  test("should return to homepage when logo is clicked", async ({
    menuPage,
  }) => {
    await menuPage.clickLogo();
    await expect(menuPage.page).toHaveURL(/.*greggs\.com\/?$/);
  });

  test("should support keyboard navigation", async ({ menuPage }) => {
    await menuPage.page.keyboard.press("Tab");
    const focusedElement = menuPage.page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    await menuPage.page.keyboard.press("Enter");
    // Should activate the focused element
  });
});
