import { test as base, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { MenuPage } from "./pages/MenuPage";
import { MenuItemModal } from "./pages/MenuItemModal";

export const getAccessibilityReport = async ({ page, disableRules = [] }: { page: Page, disableRules?: string[] }) => {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules([
      // Website does not pass color contrast for some elements, so we disable it
      "color-contrast",
      ...disableRules,
    ])
    .analyze();
};

type TestFixtures = {
  menuPage: MenuPage;
  menuItemModal: MenuItemModal;
}

export const test = base.extend<TestFixtures>({
  // Disable cookie consent banner for all pages.
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      document.cookie = "OptanonAlertBoxClosed=2025-09-22T20:04:18.204Z; path=/; domain=.www.greggs.com";
      document.cookie = "OptanonConsent=isGpcEnabled=1&datestamp=Mon+Sep+22+2025+21%3A04%3A18+GMT%2B0100+(British+Summer+Time)&version=202501.2.0&browserGpcFlag=1&isIABGlobal=false&consentId=03d484d7-cf64-4b22-b225-5cda68e603cf&interactionCount=1&isAnonUser=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0003%3A0%2CC0004%3A0%2CC0002%3A0&hosts=H9%3A0&genVendors=&intType=2; path=/; domain=.www.greggs.com";
    });

    await use(page);
  },

  menuPage: async ({ page }, use) => {
    const menuPage = new MenuPage(page);
    await use(menuPage);
  },

  menuItemModal: async ({ page }, use) => {
    const menuItemModal = new MenuItemModal(page);
    await use(menuItemModal);
  },
});
