// tests/pages/BasePage.ts
import { Page, Locator, expect } from "@playwright/test";
export class BasePage {
  readonly page: Page;
  readonly url: string;
  // Common elements
  readonly logo: Locator;
  readonly mainNavigation: Locator;
  readonly searchInput: Locator;
  readonly loadingSpinner: Locator;

  // Cookie consent elements
  readonly cookieBanner: Locator;
  readonly rejectCookiesButton: Locator;
  readonly acceptCookiesButton: Locator;
  readonly cookieSettingsButton: Locator;

  constructor(page: Page, url: string = "") {
    this.page = page;
    this.url = url;
    // Common locators
    this.logo = page
      .locator('[data-testid="logo"], .logo, img[alt*="Greggs"]')
      .first();
    this.mainNavigation = page.locator('nav, [role="navigation"]').first();
    this.searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search"], [data-testid="search"]'
      )
      .first();
    this.loadingSpinner = page.locator(
      '.loading, .spinner, [data-testid="loading"]'
    );

    // Cookie consent locators (multiple possible selectors)
    this.cookieBanner = page
      .locator(
        [
          '[data-testid="cookie-banner"]',
          ".cookie-banner",
          ".cookie-consent",
          ".cookie-notice",
          "#cookie-banner",
          '[class*="cookie"]',
          '[id*="cookie"]',
          '[aria-label*="cookie"]',
          ".onetrust-banner-sdk",
          "#onetrust-banner-sdk",
          ".cookiebot",
          ".CookieConsent",
        ].join(", ")
      )
      .first();

    this.rejectCookiesButton = page
      .locator(
        [
          'button:has-text("Reject")',
          'button:has-text("Decline")',
          'button:has-text("No")',
          'button:has-text("Reject All")',
          'button:has-text("Reject all")',
          'button:has-text("Decline All")',
          '[data-testid="reject-cookies"]',
          '[data-testid="decline-cookies"]',
          ".cookie-reject",
          ".cookie-decline",
          "#reject-cookies",
          "#decline-cookies",
          ".onetrust-reject-all-handler",
          '[data-cy="reject-cookies"]',
          'button[class*="reject"]',
          'button[id*="reject"]',
        ].join(", ")
      )
      .first();

    this.acceptCookiesButton = page
      .locator(
        [
          'button:has-text("Accept")',
          'button:has-text("Allow")',
          'button:has-text("Yes")',
          'button:has-text("Accept All")',
          'button:has-text("Allow All")',
          '[data-testid="accept-cookies"]',
          '[data-testid="allow-cookies"]',
          ".cookie-accept",
          ".cookie-allow",
          "#accept-cookies",
          "#allow-cookies",
          ".onetrust-accept-btn-handler",
          '[data-cy="accept-cookies"]',
        ].join(", ")
      )
      .first();

    this.cookieSettingsButton = page
      .locator(
        [
          'button:has-text("Settings")',
          'button:has-text("Preferences")',
          'button:has-text("Customize")',
          'button:has-text("Manage")',
          '[data-testid="cookie-settings"]',
          ".cookie-settings",
          "#cookie-settings",
        ].join(", ")
      )
      .first();
  }

  async goto() {
    await this.page.goto(this.url);
    await this.handleCookieConsent();
    await this.waitForPageLoad();
  }
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.waitForLoadingToComplete();
  }

  /**
   * Handles cookie consent banner by rejecting cookies
   * This is crucial for test execution as cookie banners can block interactions
   */
  async handleCookieConsent() {
    try {
      // Wait briefly for cookie banner to appear
      await this.page.waitForTimeout(2000);

      // Check if cookie banner is visible
      if (await this.cookieBanner.isVisible({ timeout: 3000 })) {
        console.log("Cookie banner detected, attempting to reject cookies...");

        // Try to click reject button
        if (await this.rejectCookiesButton.isVisible({ timeout: 2000 })) {
          await this.rejectCookiesButton.click();
          console.log("Rejected cookies successfully");

          // Wait for banner to disappear
          await this.cookieBanner.waitFor({ state: "hidden", timeout: 5000 });
        }
        // If reject button not found, try accept as fallback to continue tests
        else if (await this.acceptCookiesButton.isVisible({ timeout: 2000 })) {
          console.log(
            "Reject button not found, accepting cookies as fallback..."
          );
          await this.acceptCookiesButton.click();
          await this.cookieBanner.waitFor({ state: "hidden", timeout: 5000 });
        }
        // If neither button found, try clicking anywhere on the banner or press Escape
        else {
          console.log("No cookie buttons found, trying alternative methods...");

          // Try pressing Escape key
          await this.page.keyboard.press("Escape");
          await this.page.waitForTimeout(1000);

          // If banner still visible, try clicking outside it
          if (await this.cookieBanner.isVisible()) {
            const bannerBox = await this.cookieBanner.boundingBox();
            if (bannerBox) {
              // Click outside the banner
              await this.page.click("body", {
                position: { x: 10, y: 10 },
                timeout: 2000,
              });
            }
          }
        }
      } else {
        console.log("No cookie banner detected");
      }
    } catch (error) {
      console.log(
        "Cookie consent handling failed, continuing with tests:",
        error
      );
      // Don't throw error - continue with tests even if cookie handling fails
    }
  }

  /**
   * Alternative method to handle cookies using localStorage/cookies if banner persists
   */
  async setCookiePreferences() {
    try {
      // Set cookie preferences in localStorage to bypass banner
      await this.page.evaluate(() => {
        // Common localStorage keys used by cookie consent tools
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

      // Set cookies directly
      await this.page.context().addCookies([
        {
          name: "cookie-consent",
          value: "rejected",
          domain: "greggs.com",
          path: "/",
        },
        {
          name: "cookies-rejected",
          value: "true",
          domain: "greggs.com",
          path: "/",
        },
      ]);
    } catch (error) {
      console.log("Failed to set cookie preferences:", error);
    }
  }

  async waitForLoadingToComplete() {
    // Wait for loading spinner to disappear if present
    if ((await this.loadingSpinner.count()) > 0) {
      await this.loadingSpinner.waitFor({ state: "hidden", timeout: 10000 });
    }
  }
  async clickLogo() {
    await this.logo.click();
    await this.page.waitForLoadState("networkidle");
  }

  async search(searchTerm: string) {
    if ((await this.searchInput.count()) > 0) {
      await this.searchInput.fill(searchTerm);
      await this.page.waitForTimeout(1000); // Wait for search debounce
    }
  }
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
  /**
   * Force remove any overlaying cookie banners or modals
   */
  async removeOverlays() {
    try {
      await this.page.evaluate(() => {
        // Remove common overlay selectors
        const overlaySelectors = [
          ".cookie-banner",
          ".cookie-consent",
          ".modal-overlay",
          ".popup-overlay",
          '[class*="cookie"]',
          '[id*="cookie"]',
          ".onetrust-banner-sdk",
          '[style*="z-index"]',
        ];

        overlaySelectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.display = "none";
              el.remove();
            }
          });
        });
      });
    } catch (error) {
      console.log("Failed to remove overlays:", error);
    }
  }
}
