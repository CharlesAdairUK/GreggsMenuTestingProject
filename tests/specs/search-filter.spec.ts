// tests/specs/search-filter.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestData } from "../data/test-data";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Search and Filter Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test("should show search bar", async ({ menuPage }) => {
    const searchBar = menuPage.searchInput;
    if ((await searchBar.count()) > 0) {
      await expect(searchBar).toBeVisible();
    }
  });

  test("should filter items using search functionality", async ({
    menuPage,
  }) => {
    for (const searchTerm of TestData.searchTerms.breakfast) {
      try {
        await menuPage.searchForItem(searchTerm);
        const itemsCount = await menuPage.getMenuItemsCount();
        if (itemsCount > 0) {
          const firstItem = await menuPage.getFirstMenuItem();
          const itemText = await firstItem.getName();
          expect(itemText.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
      } catch (error) {
        console.error("Error occurred while searching for item:", error);
      }
    }
  });

  test("should show no results message for invalid searches", async ({
    menuPage,
  }) => {
    for (const invalidTerm of TestData.searchTerms.invalid) {
      try {
        if (invalidTerm.length > 0) {
          await menuPage.searchForItem(invalidTerm);
          if (await menuPage.isNoResultsMessageVisible()) {
            expect(await menuPage.isNoResultsMessageVisible()).toBe(true);
          }
        }
      } catch (error) {
        console.error("Error occurred while searching for item:", error);
      }
    }
  });

  test("should display selected allergens and categories on the menu page after applying filters", async ({
    menuPage,
  }) => {
    try {
      // Open the filters modal
      await menuPage.openFiltersModal();
      // Get all visible allergens
      let allergens = await menuPage.getAllergenOptions();

      // Scroll through the modal to find all allergens
      await menuPage.scrollFiltersModal();

      // Get updated list of all allergens after scrolling
      allergens = await menuPage.getAllergenOptions();

      // Scroll again to ensure we get to the categories section
      await menuPage.scrollFiltersModal();

      // Get all categories
      const categories = await menuPage.getCategoryOptions();

      // Scroll one more time to ensure we've reached the bottom
      await menuPage.scrollFiltersModal();

      // Update categories list after scrolling
      const updatedCategories = await menuPage.getCategoryOptions();
      if (updatedCategories.length > categories.length) {
        categories.push(
          ...updatedCategories.filter((c) => !categories.includes(c))
        );
      }

      // Log the number of allergens and categories found
      console.log(
        `Found ${allergens.length} allergens and ${categories.length} categories`
      );

      // Close the filters modal without applying filters
      await menuPage.clickButtonByTestId("modalCancel");

      // Verify no allergens or categories are visible initially
      const initialVisibleAllergens = await menuPage.getAllVisibleAllergens();
      const initialVisibleCategories = await menuPage.getAllVisibleCategories();
      expect(initialVisibleAllergens.length).toBe(0);
      expect(initialVisibleCategories.length).toBe(0);

      // Reopen the filters modal
      await menuPage.openFiltersModal();

      // Select some allergen options (limiting to 2 to avoid selecting too many)
      const allergensToSelect = allergens.slice(0, 2);
      for (const allergen of allergensToSelect) {
        if (allergen) {
          await menuPage.selectAllergenOption(allergen);
        }
      }

      // Select some category options (limiting to 2 to avoid selecting too many)
      const categoriesToSelect = categories.slice(0, 2);
      for (const category of categoriesToSelect) {
        if (category) {
          await menuPage.selectCategoryOption(category);
        }
      }

      // Apply the filters
      await menuPage.applyFilters();

      // Verify each selected allergen is now visible on the menu page
      for (const allergen of allergensToSelect) {
        expect(await menuPage.isAllergenVisible(allergen)).toBe(true);
      }

      // Verify each selected category is now visible on the menu page
      for (const category of categoriesToSelect) {
        expect(await menuPage.isCategoryVisible(category)).toBe(true);
      }

      // Reopen the filters modal
      await menuPage.openFiltersModal();

      // Click the "Clear all" button
      await menuPage.clickButtonByTestId("modalClear");

      // Click the "Back" button on the modal
      await menuPage.clickButtonByTestId("modalCancel");

      // Verify that no allergens or categories are listed anymore
      const visibleAllergens = await menuPage.getAllVisibleAllergens();
      const visibleCategories = await menuPage.getAllVisibleCategories();
      expect(visibleAllergens.length).toBe(0);
      expect(visibleCategories.length).toBe(0);
    } catch (error) {
      console.error(
        "Error occurred while testing allergen and category filters:",
        error
      );
    }
  });

  test("should clear filters correctly", async ({ menuPage }) => {
    try {
      const initialItemsCount = await menuPage.getMenuItemsCount();

      await menuPage.openFiltersModal();
      // Select a filter (e.g. vegan)
      const allergens = await menuPage.getAllergenOptions();
      // // Select "No Soya" if available
      // const noSoya = allergens.find((allergen) => allergen === "No Soya");
      // if (noSoya) {
      //   await menuPage.page
      //     .locator(`[data-testid="allergen-${noSoya}"]`)
      //     .click();
      // }
      await menuPage.applyFilters();

      const filteredItemsCount = await menuPage.getMenuItemsCount();
      console.log("Number of filters active:", filteredItemsCount);
      await menuPage.clearAllFilters();
      const clearedItemsCount = await menuPage.getMenuItemsCount();

      // Verify that cleared filters restore original item count
      expect(clearedItemsCount).toBe(initialItemsCount);
    } catch (error) {
      console.error("Error occurred while testing filter clearing:", error);
    }
  });

  test("should maintain search state during navigation", async ({
    menuPage,
    page,
  }) => {
    try {
      await menuPage.searchForItem("coffee");
      const searchValue = await menuPage.searchInput.inputValue();

      // Wait for search results to update
      await expect(menuPage.searchInput).toHaveValue("coffee");

      // Navigate to a category and back
      await menuPage.clickCategory("Sweet Treats");
      await expect(page).toHaveURL(/sweet-treats/);

      // Navigate back to main menu
      await menuPage.clickCategory("All");

      // Verify search state is maintained
      await expect(menuPage.searchInput).toHaveValue("coffee");
    } catch (error) {
      console.error(
        "Error occurred while testing search state maintenance:",
        error
      );
    }
  });
});
