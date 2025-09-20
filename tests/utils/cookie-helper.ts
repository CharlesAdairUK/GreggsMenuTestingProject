// tests/utils/cookie-helper.ts
import { Page, Locator } from "@playwright/test";

export class CookieHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Comprehensive cookie consent handling with multiple strategies
   */
  async handleCookieConsent(): Promise<boolean> {
    try {
      console.log("Starting cookie consent handling...");

      // Strategy 1: Wait and look for cookie banner
      await this.page.waitForTimeout(2000);

      const cookieBannerSelectors = [
        '[data-testid="cookie-banner"]',
        ".cookie-banner",
        ".cookie-consent",
        ".cookie-notice",
        "#cookie-banner",
        '[class*="cookie"][class*="banner"]',
        '[class*="cookie"][class*="consent"]',
        '[id*="cookie"][id*="banner"]',
        ".onetrust-banner-sdk",
        "#onetrust-banner-sdk",
        ".cookiebot",
        ".CookieConsent",
        '[role="dialog"][aria-label*="cookie" i]',
        '[role="banner"][class*="cookie"]',
      ];

      const cookieBanner = this.page
        .locator(cookieBannerSelectors.join(", "))
        .first();

      if (await cookieBanner.isVisible({ timeout: 3000 })) {
        console.log("Cookie banner detected");

        // Strategy 2: Try to reject cookies
        if (await this.tryRejectCookies(cookieBanner)) {
          return true;
        }

        // Strategy 3: Try to accept as fallback
        if (await this.tryAcceptCookies(cookieBanner)) {
          return true;
        }

        // Strategy 4: Try alternative methods
        return await this.tryAlternativeMethods(cookieBanner);
      }

      console.log("No cookie banner detected");
      return true;
    } catch (error) {
      console.log("Cookie handling error:", error);
      return false;
    }
  }

  private async tryRejectCookies(banner: Locator): Promise<boolean> {
    const rejectSelectors = [
      'button:has-text("Reject")',
      'button:has-text("Reject All")',
      'button:has-text("Reject all")',
      'button:has-text("Decline")',
      'button:has-text("Decline All")',
      'button:has-text("No thanks")',
      'button:has-text("No")',
      '[data-testid="reject-cookies"]',
      '[data-testid="decline-cookies"]',
      '[data-cy="reject-cookies"]',
      ".cookie-reject",
      ".cookie-decline",
      "#reject-cookies",
      "#decline-cookies",
      ".onetrust-reject-all-handler",
      'button[class*="reject"]',
      'button[id*="reject"]',
      'button[data-action="reject"]',
    ];

    for (const selector of rejectSelectors) {
      const rejectButton = banner
        .locator(selector)
        .or(this.page.locator(selector))
        .first();

      if (await rejectButton.isVisible({ timeout: 1000 })) {
        try {
          await rejectButton.click({ timeout: 3000 });
          console.log(`Clicked reject button: ${selector}`);

          // Wait for banner to disappear
          await banner.waitFor({ state: "hidden", timeout: 5000 });
          console.log("Cookie banner dismissed after rejecting");
          return true;
        } catch (error) {
          console.log(`Failed to click reject button ${selector}:`, error);
          continue;
        }
      }
    }

    return false;
  }

  private async tryAcceptCookies(banner: Locator): Promise<boolean> {
    const acceptSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("Accept all")',
      'button:has-text("Allow")',
      'button:has-text("Allow All")',
      'button:has-text("OK")',
      'button:has-text("Yes")',
      'button:has-text("I Agree")',
      '[data-testid="accept-cookies"]',
      '[data-testid="allow-cookies"]',
      '[data-cy="accept-cookies"]',
      ".cookie-accept",
      ".cookie-allow",
      "#accept-cookies",
      "#allow-cookies",
      ".onetrust-accept-btn-handler",
      'button[class*="accept"]',
      'button[id*="accept"]',
      'button[data-action="accept"]',
    ];

    for (const selector of acceptSelectors) {
      const acceptButton = banner
        .locator(selector)
        .or(this.page.locator(selector))
        .first();

      if (await acceptButton.isVisible({ timeout: 1000 })) {
        try {
          await acceptButton.click({ timeout: 3000 });
          console.log(`Clicked accept button as fallback: ${selector}`);

          await banner.waitFor({ state: "hidden", timeout: 5000 });
          console.log("Cookie banner dismissed after accepting");
          return true;
        } catch (error) {
          console.log(`Failed to click accept button ${selector}:`, error);
          continue;
        }
      }
    }

    return false;
  }

  private async tryAlternativeMethods(banner: Locator): Promise<boolean> {
    try {
      // Method 1: Press Escape key
      console.log("Trying Escape key...");
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(1000);

      if (!(await banner.isVisible())) {
        console.log("Banner dismissed with Escape key");
        return true;
      }

      // Method 2: Click outside the banner
      console.log("Trying to click outside banner...");
      const bannerBox = await banner.boundingBox();
      if (bannerBox) {
        await this.page.click("body", {
          position: { x: 10, y: 10 },
          timeout: 2000,
        });
        await this.page.waitForTimeout(1000);

        if (!(await banner.isVisible())) {
          console.log("Banner dismissed by clicking outside");
          return true;
        }
      }

      // Method 3: Try to find close button (X)
      console.log("Looking for close button...");
      const closeSelectors = [
        'button:has-text("×")',
        'button:has-text("✕")',
        ".close",
        ".modal-close",
        '[aria-label="Close"]',
        '[data-testid="close"]',
        'button[title="Close"]',
      ];

      for (const selector of closeSelectors) {
        const closeButton = banner.locator(selector).first();
        if (await closeButton.isVisible({ timeout: 500 })) {
          await closeButton.click();
          await this.page.waitForTimeout(1000);

          if (!(await banner.isVisible())) {
            console.log("Banner dismissed with close button");
            return true;
          }
        }
      }

      // Method 4: Force remove via JavaScript
      console.log("Force removing banner via JavaScript...");
      await this.page.evaluate(() => {
        const bannerSelectors = [
          ".cookie-banner",
          ".cookie-consent",
          '[class*="cookie"]',
          ".onetrust-banner-sdk",
        ];

        bannerSelectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.display = "none";
              el.remove();
            }
          });
        });
      });

      return true;
    } catch (error) {
      console.log("Alternative methods failed:", error);
      return false;
    }
  }

  /**
   * Set cookie preferences programmatically
   */
  async setCookiePreferences(
    preferences: "accept" | "reject" = "reject"
  ): Promise<void> {
    try {
      await this.page.evaluate((prefs) => {
        const cookieKeys = [
          "cookieConsent",
          "cookie-consent",
          "cookies-accepted",
          "greggs-cookies",
          "onetrust-consent",
          "CookieConsent",
          "cookiebot-consent",
          "cookie-preferences",
        ];

        cookieKeys.forEach((key) => {
          localStorage.setItem(key, prefs);
          localStorage.setItem(`${key}-status`, prefs);
          localStorage.setItem(`${key}-timestamp`, Date.now().toString());
        });

        // Set session storage as well
        cookieKeys.forEach((key) => {
          sessionStorage.setItem(key, prefs);
        });
      }, preferences);

      // Also set HTTP cookies
      await this.page.context().addCookies([
        {
          name: "cookie-consent",
          value: preferences,
          domain: ".greggs.com",
          path: "/",
        },
        {
          name: "cookies-preference",
          value: preferences,
          domain: ".greggs.com",
          path: "/",
        },
      ]);

      console.log(`Cookie preferences set to: ${preferences}`);
    } catch (error) {
      console.log("Failed to set cookie preferences:", error);
    }
  }

  /**
   * Check if cookie banner is present
   */
  async isCookieBannerPresent(): Promise<boolean> {
    const bannerSelectors = [
      ".cookie-banner",
      ".cookie-consent",
      '[class*="cookie"]',
      ".onetrust-banner-sdk",
    ];

    for (const selector of bannerSelectors) {
      const banner = this.page.locator(selector).first();
      if (await banner.isVisible({ timeout: 1000 })) {
        return true;
      }
    }

    return false;
  }
}
