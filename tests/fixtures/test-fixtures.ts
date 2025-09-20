// tests/fixtures/test-fixtures.ts
import { test as base, Page } from "@playwright/test";
import { MenuPage } from "../pages/MenuPage";
import { MenuItemModal } from "../pages/MenuItemModal";
type TestFixtures = {
  menuPage: MenuPage;
  menuItemModal: MenuItemModal;
  pageWithCookieHandling: Page;
};
export const test = base.extend<TestFixtures>({
  pageWithCookieHandling: async ({ page }, use) => {
    // Set up cookie preferences before any page navigation
    await page.route("**/*", async (route) => {
      await route.continue();
    });

    // Add cookie handling to page context
    await page.addInitScript(() => {
      // Prevent cookie banners from appearing by setting preferences early
      const cookieSettings = [
        "cookieConsent",
        "cookie-consent",
        "cookies-accepted",
        "greggs-cookies",
        "onetrust-consent",
        "CookieConsent",
      ];

      cookieSettings.forEach((key) => {
        localStorage.setItem(key, "rejected");
        localStorage.setItem(key + "-rejected", "true");
        localStorage.setItem(key + "-timestamp", Date.now().toString());
      });
    });

    await use(page);
  },

  menuPage: async ({ pageWithCookieHandling }, use) => {
    const menuPage = new MenuPage(pageWithCookieHandling);
    await use(menuPage);
  },
  menuItemModal: async ({ pageWithCookieHandling }, use) => {
    const menuItemModal = new MenuItemModal(pageWithCookieHandling);
    await use(menuItemModal);
  },
});
export { expect } from "@playwright/test";
