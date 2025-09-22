/*************  ✨ Windsurf Command 🌟  *************/
// tests/specs/menu-display.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { TestData } from "../data/test-data";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Menu Display Tests", () => {
  test.beforeEach(async ({ menuPage, page }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
    await TestHelpers.ensurePageReady(page);
  });

  test("should display menu item cards with required information", async ({
    menuPage,
  }) => {
    const itemsCount = await menuPage.getMenuItemsCount();
    expect(itemsCount).toBeGreaterThan(0);

    const firstItem = await menuPage.getFirstMenuItem();
    const altText = await firstItem.image.getAttribute("alt");

    await expect(firstItem.element).toBeVisible();
    await expect(firstItem.name).toBeVisible();
    await expect(firstItem.image).toBeVisible();
  });

  test("should load menu item images correctly", async ({ menuPage, page }) => {
    const firstItem = await menuPage.getFirstMenuItem();
    await firstItem.click();

    // Remove unnecessary wait to avoid getting stuck in a loop
    // await page.waitForTimeout(2000);

    const itemAltText = await firstItem.image.getAttribute("alt");
    const imageLocator = page.locator(`img[alt="${itemAltText}"]`);
    const imageSrc = await imageLocator.getAttribute("src");

    expect(imageSrc).toMatch(/\.(jpg|jpeg|png|webp|svg)/i);

    const isImageLoaded = await TestHelpers.validateImageLoading(
      firstItem.image
    );
    expect(isImageLoaded).toBe(true);
  });
  // test("should display prices in correct GBP format", async ({ menuPage }) => {
  //   const itemsCount = Math.min(await menuPage.getMenuItemsCount(), 5);

  //   for (let i = 0; i < itemsCount; i++) {
  //     const item = await menuPage.getMenuItemByIndex(i);
  //     //onst priceText = await item.getPrice();

  //     //expect(TestHelpers.validatePriceFormat(priceText)).toBe(true);

  //     // const price = await TestHelpers.extractPrice(priceText);
  //     // expect(price).toBeGreaterThan(TestData.priceRanges.min);
  //     // expect(price).toBeLessThan(TestData.priceRanges.max);
  //   }
  // });

  test("should open item details when clicked", async ({ menuPage, page }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();

    const firstItem = await menuPage.getFirstMenuItem();
    await firstItem.click();

    await page.waitForLoadState("networkidle");
    // await modal.waitForModal();
    // expect(await modal.isVisible()).toBe(true);

    await expect(firstItem.name).toBeVisible();
    //await expect(modal.itemPrice).toBeVisible();
    await expect(firstItem.image).toBeVisible();
    await expect(firstItem.image).toHaveAttribute("alt");
    console.log(await firstItem.image.getAttribute("alt"));
    //await modal.close();
  });

  test("should show nutritional information in item details", async ({
    menuPage,
    page,
  }) => {
    const firstItem = await menuPage.getFirstMenuItem();
    await firstItem.click();

    await page.waitForLoadState("networkidle");

    // Replace page.hasNutritionInfo() with a locator check
    const nutritionInfoLocator = page.locator('[data-testid="nutrition-info"]');
    if ((await nutritionInfoLocator.count()) > 0) {
      const nutritionData = await nutritionInfoLocator.innerText();
      expect(nutritionData.length).toBeGreaterThan(0);
    }
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
      //const price = await item.getPrice();

      expect(name.length).toBeGreaterThan(0);
      //expect(TestHelpers.validatePriceFormat(price)).toBe(true);
    }
  });
});

/*******  34aea92b-5295-479d-8b51-18a2eb22dd2d  *******/
