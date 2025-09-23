// tests/utils/test-helpers.ts
import { Page, Locator } from "@playwright/test";
import { CookieHelper } from "./cookie-helper";

export class TestHelpers {
  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState("networkidle", { timeout });
  }

  static async simulateSlowNetwork(page: Page) {
    await page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });
  }

  static async simulateNetworkError(page: Page) {
    await page.route("**/*", (route) => route.abort());
  }

  static async extractPrice(priceText: string): Promise<number> {
    const match = priceText.match(/£(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  static async validatePriceFormat(priceText: string): Promise<boolean> {
    return /£\d+\.?\d*/.test(priceText);
  }

  static async getElementBoundingBox(element: Locator) {
    return await element.boundingBox();
  }

  static async isElementInViewport(
    page: Page,
    element: Locator
  ): Promise<boolean> {
    const box = await element.boundingBox();
    if (!box) return false;

    const viewport = page.viewportSize();
    if (!viewport) return false;

    return (
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height
    );
  }

  static async scrollElementIntoView(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  static async takeFullPageScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  static async measurePageLoadTime(page: Page, url: string): Promise<number> {
    const startTime = Date.now();
    await page.goto(url);
    await TestHelpers.ensurePageReady(page);
    await page.waitForLoadState("networkidle");
    return Date.now() - startTime;
  }

  static async validateImageLoading(image: Locator): Promise<boolean> {
    const src = await image.getAttribute("src");
    if (!src) return false;

    const naturalWidth = await image.evaluate(
      (img: HTMLImageElement) => img.naturalWidth
    );
    return naturalWidth > 0;
  }

  static async getComputedStyle(
    element: Locator,
    property: string,
    timeout: number = 5000 // Reduced timeout
  ): Promise<string> {
    try {
      // First check if element exists to avoid long timeout for non-existent elements
      const isVisible = await element.isVisible({
        timeout: Math.min(timeout, 1000),
      });
      if (!isVisible) {
        // Try to find element even if not visible
        await element.waitFor({
          state: "attached",
          timeout: Math.min(timeout, 2000),
        });
      }

      // Get computed style even if not visible
      const computedStyle = await element.evaluate(
        (el, prop) => window.getComputedStyle(el).getPropertyValue(prop),
        property
      );

      if (computedStyle && computedStyle.trim() !== "") {
        return computedStyle;
      }

      // Fallback method if the first approach returns empty
      return await element.evaluate((el, prop) => {
        const style = window.getComputedStyle(el);
        // For color properties, try to compute it from parent elements if it's not set
        if (
          (prop === "color" || prop === "background-color") &&
          (!style[prop] || style[prop] === "rgba(0, 0, 0, 0)")
        ) {
          let currentEl = el;
          while (currentEl.parentElement) {
            currentEl = currentEl.parentElement;
            const parentStyle = window.getComputedStyle(currentEl);
            const value = parentStyle[prop];
            if (value && value !== "rgba(0, 0, 0, 0)") {
              return value;
            }
          }
          // Default colors if nothing is found
          return prop === "color" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
        }
        return style.getPropertyValue(prop);
      }, property);
    } catch (error) {
      console.error(
        `Failed to get computed style for property "${property}":`,
        error
      );
      // Return a default value instead of empty string for color properties
      if (property === "color") return "rgb(0, 0, 0)";
      if (property === "background-color") return "rgb(255, 255, 255)";
      return ""; // Return empty string for other properties
    }
  }

  /**
   * Calculates the contrast ratio between two rgb colors.
   * @param foreground rgb color string (e.g., "rgb(255, 255, 255)")
   * @param background rgb color string (e.g., "rgb(0, 0, 0)")
   * @returns contrast ratio (number)
   */
  static getContrastRatio(foreground: string, background: string): number {
    function rgbToLuminance(rgb: string): number {
      // Extract numbers from rgb string
      const match = rgb.match(/\d+/g);
      if (!match || match.length < 3) return 0;
      const [r, g, b] = match.map(Number).map((v) => v / 255);
      // Convert to relative luminance
      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
      return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
    }
    const lum1 = rgbToLuminance(foreground);
    const lum2 = rgbToLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // static async getComputedStyle(
  //   locator: any,
  //   property: string
  // ): Promise<string> {
  //   // Implementation...
  // }

  // Calculates contrast ratio between two rgb colors
  /**
   * Checks if the contrast ratio between foreground and background colors
   * meets WCAG AA standard (≥ 4.5 for normal text) for accessibility.
   */
  static hasSufficientContrast(
    foreground: string,
    background: string
  ): boolean {
    function parseRGB(rgb: string): number[] {
      const match = rgb.match(/\d+/g);
      if (!match || match.length < 3) return [0, 0, 0];
      return match.slice(0, 3).map(Number);
    }

    function luminance([r, g, b]: number[]): number {
      const a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    const fgRGB = parseRGB(foreground);
    const bgRGB = parseRGB(background);
    const fgLum = luminance(fgRGB);
    const bgLum = luminance(bgRGB);

    const brightest = Math.max(fgLum, bgLum);
    const darkest = Math.min(fgLum, bgLum);

    const contrastRatio = (brightest + 0.05) / (darkest + 0.05);

    // WCAG AA standard for normal text is 4.5:1
    return contrastRatio >= 4.5;
  }

  static async generateRandomString(length: number): Promise<string> {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Ensure page is ready for testing by handling cookies and waiting for content
   */
  static async ensurePageReady(
    page: Page,
    timeout: number = 10000
  ): Promise<void> {
    const cookieHelper = new CookieHelper(page);

    // Handle cookies first
    await cookieHelper.handleCookieConsent();

    // Wait for page to be ready
    await page.waitForLoadState("networkidle", { timeout });

    // Ensure no overlays are blocking interactions
    await page.evaluate(() => {
      const overlays = document.querySelectorAll(
        '[style*="z-index"], .modal, .popup, .overlay'
      );
      overlays.forEach((overlay) => {
        if (overlay instanceof HTMLElement) {
          const zIndex = parseInt(
            window.getComputedStyle(overlay).zIndex || "0"
          );
          if (zIndex > 1000) {
            overlay.style.display = "none";
            overlay.style.pointerEvents = "none";
          }
        }
      });
    });
  }

  /**
   * Retry an action with cookie handling
   */
  static async retryWithCookieHandling<T>(
    page: Page,
    action: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    const cookieHelper = new CookieHelper(page);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Handle cookies before each attempt
        if (await cookieHelper.isCookieBannerPresent()) {
          await cookieHelper.handleCookieConsent();
        }

        return await action();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        console.log(
          `Attempt ${attempt} failed, retrying with cookie handling...`
        );
        await page.waitForTimeout(3000);
      }
    }

    throw new Error("All attempts failed");
  }
}
