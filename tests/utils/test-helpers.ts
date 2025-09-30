// tests/utils/test-helpers.ts
import { Page, Locator } from '@playwright/test'

export class TestHelpers {
  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState('networkidle', { timeout })
  }

  static async simulateSlowNetwork(page: Page) {
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })
  }

  static async simulateNetworkError(page: Page) {
    await page.route('**/*', (route) => route.abort())
  }

  static async extractPrice(priceText: string): Promise<number> {
    const match = priceText.match(/£(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : 0
  }

  static async validatePriceFormat(priceText: string): Promise<boolean> {
    return /£\d+\.?\d*/.test(priceText)
  }

  static async getElementBoundingBox(element: Locator) {
    return await element.boundingBox()
  }

  static async isElementInViewport(
    page: Page,
    element: Locator,
  ): Promise<boolean> {
    const box = await element.boundingBox()
    if (!box) return false

    const viewport = page.viewportSize()
    if (!viewport) return false

    return (
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= viewport.width &&
      box.y + box.height <= viewport.height
    )
  }

  static async scrollElementIntoView(element: Locator) {
    await element.scrollIntoViewIfNeeded()
  }

  static async takeFullPageScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    })
  }

  static async measurePageLoadTime(page: Page, url: string): Promise<number> {
    const startTime = Date.now()
    await page.goto(url)
    //await TestHelpers.ensurePageReady(page)
    await page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }

  static async validateImageLoading(image: Locator): Promise<boolean> {
    const src = await image.getAttribute('src')
    if (!src) return false

    const naturalWidth = await image.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    )
    return naturalWidth > 0
  }

  static async generateRandomString(length: number): Promise<string> {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  /**
   * Ensure page is ready for testing by handling cookies and waiting for content
   */
  static async ensurePageReady(
    page: Page,
    timeout: number = 10000,
  ): Promise<void> {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle', { timeout })

    // Ensure no overlays are blocking interactions
    await page.evaluate(() => {
      const overlays = document.querySelectorAll(
        '[style*="z-index"], .modal, .popup, .overlay',
      )
      overlays.forEach((overlay) => {
        if (overlay instanceof HTMLElement) {
          const zIndex = parseInt(
            window.getComputedStyle(overlay).zIndex || '0',
          )
          if (zIndex > 1000) {
            overlay.style.display = 'none'
            overlay.style.pointerEvents = 'none'
          }
        }
      })
    })
  }
}
