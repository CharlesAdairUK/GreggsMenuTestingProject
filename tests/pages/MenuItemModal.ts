// tests/pages/MenuItemModal.ts
import { Page, Locator } from "@playwright/test";

export class MenuItemModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly itemName: Locator;
  readonly itemPrice: Locator;
  readonly itemImage: Locator;
  readonly itemDescription: Locator;
  readonly nutritionInfo: Locator;
  readonly allergenInfo: Locator;
  readonly quantitySelector: Locator;
  readonly quantityIncrease: Locator;
  readonly quantityDecrease: Locator;
  readonly quantityInput: Locator;
  readonly addToBasketButton: Locator;

  // Nutrition fields
  readonly caloriesValue: Locator;
  readonly fatValue: Locator;
  readonly saltValue: Locator;
  readonly sugarValue: Locator;
  readonly proteinValue: Locator;

  constructor(page: Page) {
    this.page = page;

    this.modal = page
      .locator(
        '.modal, [data-testid="modal"], .popup, .overlay, .product-detail'
      )
      .first();
    this.closeButton = page
      .locator(
        '.close, [data-testid="close"], .modal-close, button:has-text("×")'
      )
      .first();
    this.itemName = this.modal
      .locator('h1, h2, .modal-title, [data-testid="modal-item-name"]')
      .first();
    this.itemPrice = this.modal
      .locator('.price, [data-testid="modal-price"]')
      .first();
    this.itemImage = this.modal.locator("img").first();
    this.itemDescription = this.modal
      .locator('.description, [data-testid="modal-description"]')
      .first();
    this.nutritionInfo = this.modal
      .locator('.nutrition, [data-testid="nutrition"], .nutritional-info')
      .first();
    this.allergenInfo = this.modal
      .locator('.allergen-info, [data-testid="allergen-info"]')
      .first();

    // Quantity controls
    this.quantitySelector = this.modal
      .locator('.quantity, [data-testid="quantity"]')
      .first();
    this.quantityIncrease = this.modal
      .locator(
        '[data-testid="quantity-increase"], .quantity-plus, button:has-text("+")'
      )
      .first();
    this.quantityDecrease = this.modal
      .locator(
        '[data-testid="quantity-decrease"], .quantity-minus, button:has-text("-")'
      )
      .first();
    this.quantityInput = this.modal
      .locator('[data-testid="quantity-input"], input[type="number"]')
      .first();
    this.addToBasketButton = this.modal
      .locator(
        '[data-testid="add-to-basket"], button:has-text("Add to Basket")'
      )
      .first();

    // Nutrition values
    this.caloriesValue = this.modal
      .locator('[data-testid="calories"], .calories-value')
      .first();
    this.fatValue = this.modal
      .locator('[data-testid="fat"], .fat-value')
      .first();
    this.saltValue = this.modal
      .locator('[data-testid="salt"], .salt-value')
      .first();
    this.sugarValue = this.modal
      .locator('[data-testid="sugar"], .sugar-value')
      .first();
    this.proteinValue = this.modal
      .locator('[data-testid="protein"], .protein-value')
      .first();
  }

  async waitForModal() {
    await this.modal.waitFor({ state: "visible", timeout: 5000 });
  }

  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  async close() {
    await this.closeButton.click();
    await this.modal.waitFor({ state: "hidden", timeout: 3000 });
  }

  async getItemName(): Promise<string> {
    return (await this.itemName.textContent()) || "";
  }

  async getItemPrice(): Promise<string> {
    return (await this.itemPrice.textContent()) || "";
  }

  async getDescription(): Promise<string> {
    return (await this.itemDescription.textContent()) || "";
  }

  async hasNutritionInfo(): Promise<boolean> {
    return await this.nutritionInfo.isVisible();
  }

  async hasAllergenInfo(): Promise<boolean> {
    return await this.allergenInfo.isVisible();
  }

  async increaseQuantity() {
    await this.quantityIncrease.click();
  }

  async decreaseQuantity() {
    await this.quantityDecrease.click();
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async getQuantity(): Promise<number> {
    const value = (await this.quantityInput.getAttribute("value")) || "1";
    return parseInt(value, 10);
  }

  async addToBasket() {
    await this.addToBasketButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getNutritionValue(
    field: "calories" | "fat" | "salt" | "sugar" | "protein"
  ): Promise<string> {
    const locatorMap = {
      calories: this.caloriesValue,
      fat: this.fatValue,
      salt: this.saltValue,
      sugar: this.sugarValue,
      protein: this.proteinValue,
    };

    const locator = locatorMap[field];
    if (await locator.isVisible()) {
      return (await locator.textContent()) || "";
    }
    return "";
  }

  async getAllNutritionInfo(): Promise<{ [key: string]: string }> {
    const nutrition: { [key: string]: string } = {};

    const fields = ["calories", "fat", "salt", "sugar", "protein"] as const;
    for (const field of fields) {
      nutrition[field] = await this.getNutritionValue(field);
    }

    return nutrition;
  }
}
