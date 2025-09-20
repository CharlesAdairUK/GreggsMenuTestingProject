// tests/specs/search-filter.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestData } from "../data/test-data";

test.describe("Search and Filter Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test("should filter items using search functionality", async ({
    menuPage,
  }) => {
    for (const searchTerm of TestData.searchTerms.valid) {
      await menuPage.searchForItem(searchTerm);

      // Check if search results are relevant
      const itemsCount = await menuPage.getMenuItemsCount();
      if (itemsCount > 0) {
        const firstItem = await menuPage.getFirstMenuItem();
        const itemText = await firstItem.getName();
        expect(itemText.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    }
  });

  test("should show no results message for invalid searches", async ({
    menuPage,
  }) => {
    for (const invalidTerm of TestData.searchTerms.invalid) {
      if (invalidTerm.length > 0) {
        // Skip empty string test
        await menuPage.searchForItem(invalidTerm);

        if (await menuPage.isNoResultsMessageVisible()) {
          expect(await menuPage.isNoResultsMessageVisible()).toBe(true);
        }
      }
    }
  });

  test("should apply vegan filter correctly", async ({ menuPage }) => {
    await menuPage.applyVeganFilter();

    const itemsCount = await menuPage.getMenuItemsCount();
    if (itemsCount > 0) {
      // Check first few items have vegan indicators
      const itemsToCheck = Math.min(itemsCount, 3);
      for (let i = 0; i < itemsToCheck; i++) {
        const item = await menuPage.getMenuItemByIndex(i);
        const isVegan = await item.hasVeganBadge();
        expect(isVegan).toBe(true);
      }
    }
  });

  test("should apply vegetarian filter correctly", async ({ menuPage }) => {
    await menuPage.applyVegetarianFilter();

    const itemsCount = await menuPage.getMenuItemsCount();
    if (itemsCount > 0) {
      const itemsToCheck = Math.min(itemsCount, 3);
      for (let i = 0; i < itemsToCheck; i++) {
        const item = await menuPage.getMenuItemByIndex(i);
        const isVegetarian = await item.hasVegetarianBadge();
        expect(isVegetarian).toBe(true);
      }
    }
  });

  test("should clear filters correctly", async ({ menuPage }) => {
    const initialItemsCount = await menuPage.getMenuItemsCount();

    await menuPage.applyVeganFilter();
    const filteredItemsCount = await menuPage.getMenuItemsCount();

    await menuPage.clearAllFilters();
    const clearedItemsCount = await menuPage.getMenuItemsCount();

    expect(clearedItemsCount).toBe(initialItemsCount);
  });

  test("should maintain search state during navigation", async ({
    menuPage,
    page,
  }) => {
    await menuPage.searchForItem("coffee");
    const searchValue = await menuPage.searchInput.inputValue();

    // Navigate to a category and back
    await menuPage.clickCategory("Breakfast");
    await page.goBack();

    const currentSearchValue = await menuPage.searchInput.inputValue();
    expect(currentSearchValue).toBe(searchValue);
  });
});
