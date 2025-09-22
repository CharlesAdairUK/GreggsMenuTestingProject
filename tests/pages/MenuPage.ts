// tests/pages/MenuPage.ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { MenuItemModal } from "./MenuItemModal";

export class MenuPage extends BasePage {
  readonly menuCategories: Locator;
  readonly menuItems: Locator;
  readonly categoryLinks: Locator;
  readonly filterButtons!: Locator;
  readonly menuGrid: Locator;
  readonly noResultsMessage: Locator;
  readonly errorMessage: Locator;

  // Category-specific locators
  readonly allSection: Locator;
  readonly breakfastSection: Locator;
  readonly savouriesSection: Locator;
  readonly pizzasSection: Locator;
  readonly sandwichesSection: Locator;
  readonly drinksSection: Locator;
  readonly sweetTreatsSection: Locator;
  readonly hotFoodSection: Locator;

  // Filter locators

  readonly expectedCategories = [
    "ALL",
    "Breakfast",
    "Savouries & Bakes",
    "Drinks & Snacks",
    "Sandwiches & Salads",
    "Sweet Treats",
    "Hot Food",
  ];

  constructor(page: Page) {
    super(page, "https://www.greggs.com/menu");

    // Menu-specific locators
    this.menuCategories = page.locator(
      '.menu-category, [data-testid="menu-category"]'
    );

    this.menuItems = page.locator("a[data-test-card]");
    this.categoryLinks = page.locator(
      '.category-link, [data-testid="category-link"]'
    );
    this.filterButtons = page.locator('.filter-button, [data-test="filter"]');
    //this.menuGrid = page.locator(
    //'.menu-grid, [data-testid="menu-grid"], .product-grid'
    //);
    this.menuGrid = page.locator('button[data-component="HeaderSwitch"]');
    this.noResultsMessage = page.locator(
      '.no-results, [data-testid="no-results"], .empty-state'
    );
    this.errorMessage = page.locator(
      '.error, [data-testid="error"], .network-error, h2:has-text("Oh crumbs!")'
    );

    // Category sections
    this.allSection = page.locator(
      '[data-category="all"], .all-section, section:has(h2:has-text("All"))'
    );

    this.breakfastSection = page.locator(
      '[data-category="breakfast"], .breakfast-section, button:has-text("Breakfast"), section:has(h2:has-text("Breakfast"))'
    );
    this.savouriesSection = page.locator(
      '[data-category="savouries"], .savouries-section, section:has(h2:has-text("Savouries"))'
    );
    this.pizzasSection = page.locator(
      '[data-category="pizzas"], .pizzas-section, section:has(h2:has-text("Pizzas"))'
    );
    this.sandwichesSection = page.locator(
      '[data-category="sandwiches"], .sandwiches-section, section:has(h2:has-text("Sandwiches"))'
    );
    this.drinksSection = page.locator(
      '[data-category="drinks"], .drinks-section, section:has(h2:has-text("Drinks"))'
    );
    this.sweetTreatsSection = page.locator(
      '[data-category="sweet-treats"], .sweet-treats-section, section:has(h2:has-text("Sweet"))'
    );
    this.hotFoodSection = page.locator(
      '[data-category="hot-food"], .hot-food-section, section:has(h2:has-text("Hot Food"))'
    );

    // Filters
    // // this.veganFilter = page.locator(
    // //   'button:has-text("Vegan"), [data-filter="vegan"]'
    // // );
    // this.vegetarianFilter = page.locator(
    //   'button:has-text("Vegetarian"), [data-filter="vegetarian"]'
    // );
    // this.glutenFreeFilter = page.locator(
    //   'button:has-text("Gluten Free"), [data-filter="gluten-free"]'
    // );
  }

  async waitForMenuItemsToLoad() {
    // Ensure cookie consent is handled first
    try {
      if (typeof this.handleCookieConsent === "function") {
        await this.handleCookieConsent();
      }
    } catch (e) {
      // Ignore errors if cookie banner is not present
    }
    // Wait for menu items to be present with increased timeout and existence check
    if ((await this.page.locator("a[data-test-card]").count()) > 0) {
      await this.page.waitForSelector("a[data-test-card]", {
        timeout: 30000,
        state: "visible",
      });
    }
    await this.waitForLoadingToComplete();
  }

  async openFiltersModal(): Promise<void> {
    // Replace the selector below with the actual selector for your filters modal button
    const filterButton = this.page.locator('button[data-test="filterButton"]');
    await filterButton.waitFor({ state: "visible" });
    await filterButton.click();
    // Wait for the modal header to be visible (more robust than a generic modal selector)
    await this.page.waitForSelector('header:has(h3:has-text("Filters"))', {
      state: "visible",
    });
  }

  async applyFilters() {
    // Ensure the button is scrolled into view and not covered
    const applyButton = this.page.locator(
      'button[type="button"][data-test="modalApply"]'
    );
    await applyButton.scrollIntoViewIfNeeded();
    await applyButton.waitFor({ state: "visible" });
    // Use force click if intercepted by another element
    await applyButton.click({ force: true });
    // Optionally, wait for the menu items to reload
    await this.waitForMenuItemsToLoad();
  }

  async getAllergenOptionsById(): Promise<string[]> {
    const allergenOptions = this.page.locator('[data-testid^="allergen-"]');
    const count = await allergenOptions.count();
    const options: string[] = [];

    for (let i = 0; i < count; i++) {
      const option = allergenOptions.nth(i);
      const testId = await option.getAttribute("data-testid");
      if (testId) {
        options.push(testId.replace("allergen-", ""));
      }
    }

    return options;
  }

  async selectAllergenOption(allergen: string): Promise<void> {
    await this.page.locator(`[data-testid="allergen-${allergen}"]`).click();
  }

  /**
   * Returns a list of available allergen options.
   */
  async getAllergenOptions(): Promise<string[]> {
    // Get the allergen labels from the filter form
    const allergenLabels = await this.page.$$(
      'label:has(span:text-matches("^No [A-Za-z]+$"))'
    );
    const allergens = [];
    for (const element of allergenLabels) {
      const labelText = await element.$eval("span", (span) => span.textContent);
      if (labelText) {
        // Remove the "No " prefix to get the allergen name
        allergens.push(labelText.replace("No ", ""));
      }
    }
    return allergens;
  }

  async selectAllergen(allergen: string): Promise<void> {
    // Find the allergen label that contains "No {allergen}"
    const allergenLabel = this.page.locator(
      `label:has(span:text("No ${allergen}"))`
    );

    // Click the label to check the checkbox
    await allergenLabel.click();

    // Hit the "Apply Filters" button after selecting the allergen
    await this.page.click('button[data-test="modalApply"]');
    await this.waitForMenuItemsToLoad();

    // Verify the allergen filter is applied (check for filter pill or indicator)
    try {
      const pill = this.page.locator(
        `[data-test="filterPills"]:has-text("${allergen}")`
      );
      await expect(pill).toBeVisible({ timeout: 5000 });
    } catch (e) {
      // If no pill, check if there's another indicator that the filter is applied
      console.log(
        `Note: Could not find filter pill for ${allergen}. Continuing test.`
      );
    }
  }

  /**
   * Checks if the given allergen is visible on the menu page.
   * @param allergen The allergen to check for visibility.
   * @returns Promise<boolean>
   */
  async isAllergenVisible(allergen: string): Promise<boolean> {
    // Replace the selector below with the actual selector for allergens
    const allergenLocator = this.page.locator(`text=${allergen}`);
    return await allergenLocator.isVisible();
  }

  // async applyFilters(): Promise<void> {
  //   // implementation
  // }
  // Add the missing methods for category operations
  async getCategoryOptions(): Promise<string[]> {
    // Implementation to get all category options from the filters modal
    const categoryOptions = await this.page.$$eval(
      '[data-testid^="category-"]',
      (elements) =>
        elements.map(
          (el) => el.getAttribute("data-testid")?.replace("category-", "") || ""
        )
    );
    return categoryOptions.filter((option) => option.length > 0);
  }

  async selectCategoryOption(category: string): Promise<void> {
    // Implementation to select a category option in the filters modal
    await this.page.locator(`[data-testid="category-${category}"]`).click();
  }

  async isCategoryVisible(category: string): Promise<boolean> {
    // Implementation to check if a category is visible on the menu page
    const count = await this.page
      .locator(`[data-testid="selected-category-${category}"]`)
      .count();
    return count > 0;
  }

  async getAllVisibleCategories(): Promise<string[]> {
    // Implementation to get all visible categories on the menu page
    const categories = await this.page.$$eval(
      '[data-testid^="selected-category-"]',
      (elements) =>
        elements.map(
          (el) =>
            el.getAttribute("data-testid")?.replace("selected-category-", "") ||
            ""
        )
    );
    return categories.filter((category) => category.length > 0);
  }
  4;

  /**
   * Scrolls the filters modal to reveal more options
   */
  async scrollFiltersModal() {
    // Scroll the modal content to reveal more filters
    await this.page.evaluate(() => {
      const modal = document.querySelector('[data-testid="filtersModal"]');
      if (modal) {
        modal.scrollBy(0, 300);
      }
    });
    // Wait a short time for any lazy-loaded content to appear
    await this.page.waitForTimeout(500);
  }

  async getAllCategoryNames(): Promise<string[]> {
    const categories: string[] = [];
    for (const category of this.expectedCategories) {
      let element: Locator;
      if (category === "ALL") {
        // "ALL" may be shown as "All" or without a category identifier
        element = this.page.getByText("All", { exact: false }).first();
      } else {
        element = this.page.getByText(category, { exact: true }).first();
      }
      if ((await element.count()) > 0) {
        categories.push(category);
      }
    }
    return categories;
  }

  /*************  ✨ Windsurf Command 🌟  *************/
  async clickCategory(categoryName: string) {
    const categoryLink = this.page
      .locator(`button:has-text("${categoryName}")`)
      .first();
    if ((await categoryLink.count()) > 0) {
      await categoryLink.click();
      await this.waitForPageLoad();
    }
    await categoryLink.click();
    await this.waitForPageLoad();
  }
  /*******  9136c143-3137-41c6-a152-fa6027e5af77  *******/

  async getMenuItemsCount(): Promise<number> {
    await this.waitForMenuItemsToLoad();
    return await this.menuItems.count();
  }

  async dismissErrorMessage(): Promise<void> {
    // Example: Click a button with a known selector to dismiss the error message
    const dismissButton = this.page.locator(
      '.error-message-dismiss, .error-close, button:has-text("Dismiss")'
    );
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
  }

  async getMenuItemByIndex(index: number): Promise<MenuItemElement> {
    const item = this.menuItems.nth(index);
    return new MenuItemElement(item, this.page);
  }

  async getFirstMenuItem(): Promise<MenuItemElement> {
    return await this.getMenuItemByIndex(0);
  }

  async searchForItem(searchTerm: string) {
    await this.search(searchTerm);
  }

  async clearAllFilters() {
    const clearButton = this.page.locator(
      '.clear-filters, [data-testid="clear-filters"]'
    );
    if ((await clearButton.count()) > 0) {
      await clearButton.click();
      await this.waitForLoadingToComplete();
    }
  }

  // Duplicate isAllergenVisible method removed

  async getAllVisibleAllergens(): Promise<string[]> {
    // Replace selector with the actual selector for visible allergens
    const allergenElements = await this.page.$$(".allergen-visible-selector");
    const allergens: string[] = [];
    for (const element of allergenElements) {
      const text = await element.textContent();
      if (text !== null) {
        allergens.push(text);
      }
    }
    return allergens;
  }

  async clickButtonByTestId(testId: string) {
    await this.page.getByTestId(testId).click();
  }

  async scrollToBottom() {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.page.waitForTimeout(2000);
  }

  async isNoResultsMessageVisible(): Promise<boolean> {
    return await this.noResultsMessage.isVisible();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getCategorySection(categoryName: string): Promise<Locator> {
    const categoryMap: { [key: string]: Locator } = {
      ALL: this.allSection,
      Breakfast: this.breakfastSection,
      "Savouries & Bakes": this.savouriesSection,
      "Sandwiches & Salads": this.sandwichesSection,
      "Drinks & Snacks": this.drinksSection,
      "Sweet Treats": this.sweetTreatsSection,
      "Hot Food": this.hotFoodSection,
    };

    return (
      categoryMap[categoryName] ||
      this.page.locator(
        `[data-category="${categoryName.toLowerCase().replace(/\s+/g, "-")}"]`
      )
    );
  }

  async getItemsInCategory(categoryName: string): Promise<MenuItemElement[]> {
    const section = await this.getCategorySection(categoryName);
    const items = section.locator(
      '.menu-item, [data-testid="menu-item"], .product-card'
    );
    const itemCount = await items.count();

    const menuItems: MenuItemElement[] = [];
    for (let i = 0; i < itemCount; i++) {
      menuItems.push(new MenuItemElement(items.nth(i), this.page));
    }

    return menuItems;
  }
}

export class MenuItemElement {
  readonly element: Locator;
  readonly page: Page;
  readonly name: Locator;
  readonly price: Locator;
  readonly image: Locator;
  readonly description: Locator;
  readonly addToBasketButton: Locator;
  readonly allergenBadges: Locator;
  readonly dietaryBadges: Locator;
  readonly calorieInfo: Locator;
  readonly outOfStockBadge: Locator;

  constructor(element: Locator, page: Page) {
    this.element = element;
    this.page = page;

    // Item-specific locators
    this.name = element
      .locator(
        'h2, h3, h4, .item-name, .product-name, [data-testid="item-name"]'
      )
      .first();
    this.price = element
      .locator('.price, [data-testid="price"], .cost')
      .first();
    this.image = element.locator("img").first();
    this.description = element
      .locator('.description, [data-testid="description"], p')
      .first();
    this.addToBasketButton = element
      .locator(
        'button:has-text("Add"), .add-to-basket, [data-testid="add-to-basket"]'
      )
      .first();
    this.allergenBadges = element.locator(
      '.allergen, [data-testid="allergen"]'
    );
    this.dietaryBadges = element.locator(
      '.dietary, [data-testid="dietary"], .vegan, .vegetarian'
    );
    this.calorieInfo = element
      .locator('.calories, [data-testid="calories"], .kcal')
      .first();
    this.outOfStockBadge = element
      .locator('.out-of-stock, [data-stock="false"], .unavailable')
      .first();
  }

  // Removed duplicate MenuPage class definition

  async click(): Promise<MenuItemModal> {
    await this.element.click();
    await this.page.waitForTimeout(500); // Wait for modal animation
    return new MenuItemModal(this.page);
  }

  async getName(): Promise<string> {
    return (await this.name.textContent()) || "";
  }

  async getPrice(): Promise<string> {
    return (await this.price.textContent()) || "";
  }

  async getImageAlt(): Promise<string> {
    return (await this.image.getAttribute("alt")) || "";
  }

  async isVisible(): Promise<boolean> {
    return await this.element.isVisible();
  }

  async isOutOfStock(): Promise<boolean> {
    return await this.outOfStockBadge.isVisible();
  }

  async hasVeganBadge(): Promise<boolean> {
    const veganBadge = this.element.locator('.vegan, [data-vegan="true"]');
    return (await veganBadge.count()) > 0;
  }

  async hasVegetarianBadge(): Promise<boolean> {
    const vegetarianBadge = this.element.locator(
      '.vegetarian, [data-vegetarian="true"]'
    );
    return (await vegetarianBadge.count()) > 0;
  }

  async getAllergenCount(): Promise<number> {
    return await this.allergenBadges.count();
  }

  async addToBasket() {
    if (
      (await this.addToBasketButton.count()) > 0 &&
      (await this.addToBasketButton.isEnabled())
    ) {
      await this.addToBasketButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async hover() {
    await this.element.hover();
  }

  async getBoundingBox() {
    return await this.element.boundingBox();
  }
}
