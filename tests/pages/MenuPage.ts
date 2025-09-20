// tests/pages/MenuPage.ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { MenuItemModal } from "./MenuItemModal";

export class MenuPage extends BasePage {
  readonly menuCategories: Locator;
  readonly menuItems: Locator;
  readonly categoryLinks: Locator;
  readonly filterButtons: Locator;
  readonly menuGrid: Locator;
  readonly noResultsMessage: Locator;
  readonly errorMessage: Locator;

  // Category-specific locators
  readonly breakfastSection: Locator;
  readonly savouriesSection: Locator;
  readonly pizzasSection: Locator;
  readonly sandwichesSection: Locator;
  readonly drinksSection: Locator;
  readonly sweetTreatsSection: Locator;
  readonly hotFoodSection: Locator;

  // Filter locators
  readonly veganFilter: Locator;
  readonly vegetarianFilter: Locator;
  readonly glutenFreeFilter: Locator;

  readonly expectedCategories = [
    "Breakfast",
    "Savouries & Bakes",
    "Pizzas",
    "Sandwiches & Salads",
    "Drinks & Snacks",
    "Sweet Treats",
    "Hot Food",
  ];

  constructor(page: Page) {
    super(page, "https://www.greggs.com/menu");

    // Menu-specific locators
    this.menuCategories = page.locator(
      '.menu-category, [data-testid="menu-category"]'
    );
    this.menuItems = page.locator(
      '.menu-item, [data-testid="menu-item"], .product-card'
    );
    this.categoryLinks = page.locator(
      '.category-link, [data-testid="category-link"]'
    );
    this.filterButtons = page.locator('.filter-button, [data-testid="filter"]');
    this.menuGrid = page.locator(
      '.menu-grid, [data-testid="menu-grid"], .product-grid'
    );
    this.noResultsMessage = page.locator(
      '.no-results, [data-testid="no-results"], .empty-state'
    );
    this.errorMessage = page.locator(
      '.error, [data-testid="error"], .network-error'
    );

    // Category sections
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
    this.veganFilter = page.locator(
      'button:has-text("Vegan"), [data-filter="vegan"]'
    );
    this.vegetarianFilter = page.locator(
      'button:has-text("Vegetarian"), [data-filter="vegetarian"]'
    );
    this.glutenFreeFilter = page.locator(
      'button:has-text("Gluten Free"), [data-filter="gluten-free"]'
    );
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
    // Wait for menu items to be present
    await this.page.waitForSelector("a[data-test-card]", {
      timeout: 15000,
      state: "visible",
    });
    await this.waitForLoadingToComplete();
  }

  async getAllCategoryNames(): Promise<string[]> {
    const categories: string[] = [];
    for (const category of this.expectedCategories) {
      const element = this.page.locator(`text="${category}"`).first();
      if ((await element.count()) > 0) {
        categories.push(category);
      }
    }
    return categories;
  }

  async clickCategory(categoryName: string) {
    const categoryLink = this.page.locator(`text="${categoryName}"`).first();
    await categoryLink.click();
    await this.waitForPageLoad();
  }

  async getMenuItemsCount(): Promise<number> {
    await this.waitForMenuItemsToLoad();
    return await this.menuItems.count();
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

  async applyVeganFilter() {
    if ((await this.veganFilter.count()) > 0) {
      await this.veganFilter.click();
      await this.waitForLoadingToComplete();
    }
  }

  async applyVegetarianFilter() {
    if ((await this.vegetarianFilter.count()) > 0) {
      await this.vegetarianFilter.click();
      await this.waitForLoadingToComplete();
    }
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
      Breakfast: this.breakfastSection,
      "Savouries & Bakes": this.savouriesSection,
      Pizzas: this.pizzasSection,
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

  async getImageSrc(): Promise<string> {
    return (await this.image.getAttribute("src")) || "";
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
