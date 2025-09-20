// tests/specs/menu-display.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestData } from "../data/test-data";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Menu Display Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test("should display menu item cards with required information", async ({
    menuPage,
  }) => {
    const itemsCount = await menuPage.getMenuItemsCount();
    expect(itemsCount).toBeGreaterThan(0);

    const firstItem = await menuPage.getFirstMenuItem();

    await expect(firstItem.element).toBeVisible();
    await expect(firstItem.name).toBeVisible();
    await expect(firstItem.price).toBeVisible();
    await expect(firstItem.image).toBeVisible();
  });

  test("should load menu item images correctly", async ({ menuPage }) => {
    const firstItem = await menuPage.getFirstMenuItem();

    const imageSrc = await firstItem.getImageSrc();
    expect(imageSrc).toMatch(/\.(jpg|jpeg|png|webp|svg)/i);

    const isImageLoaded = await TestHelpers.validateImageLoading(
      firstItem.image
    );
    expect(isImageLoaded).toBe(true);
  });

  test("should display prices in correct GBP format", async ({ menuPage }) => {
    const itemsCount = Math.min(await menuPage.getMenuItemsCount(), 5);

    for (let i = 0; i < itemsCount; i++) {
      const item = await menuPage.getMenuItemByIndex(i);
      const priceText = await item.getPrice();

      expect(TestHelpers.validatePriceFormat(priceText)).toBe(true);

      const price = await TestHelpers.extractPrice(priceText);
      expect(price).toBeGreaterThan(TestData.priceRanges.min);
      expect(price).toBeLessThan(TestData.priceRanges.max);
    }
  });

  test("should open item details when clicked", async ({ menuPage }) => {
    const firstItem = await menuPage.getFirstMenuItem();
    const modal = await firstItem.click();

    await modal.waitForModal();
    expect(await modal.isVisible()).toBe(true);

    await expect(modal.itemName).toBeVisible();
    //await expect(modal.itemPrice).toBeVisible();

    await modal.close();
  });

  test("should show nutritional information in item details", async ({
    menuPage,
  }) => {
    const firstItem = await menuPage.getFirstMenuItem();
    const modal = await firstItem.click();

    await modal.waitForModal();

    if (await modal.hasNutritionInfo()) {
      const nutritionData = await modal.getAllNutritionInfo();
      expect(Object.keys(nutritionData).length).toBeGreaterThan(0);
    }

    await modal.close();
  });

  test("should handle out of stock items correctly", async ({ menuPage }) => {
    const itemsCount = await menuPage.getMenuItemsCount();

    for (let i = 0; i < Math.min(itemsCount, 10); i++) {
      const item = await menuPage.getMenuItemByIndex(i);

      if (await item.isOutOfStock()) {
        await expect(item.outOfStockBadge).toBeVisible();

        if ((await item.addToBasketButton.count()) > 0) {
          await expect(item.addToBasketButton).toBeDisabled();
        }
      }
    }
  });

  test("should display consistent item information", async ({ menuPage }) => {
    const itemsCount = Math.min(await menuPage.getMenuItemsCount(), 3);

    for (let i = 0; i < itemsCount; i++) {
      const item = await menuPage.getMenuItemByIndex(i);

      const name = await item.getName();
      const price = await item.getPrice();

      expect(name.length).toBeGreaterThan(0);
      expect(TestHelpers.validatePriceFormat(price)).toBe(true);
    }
  });
});
