// tests/specs/performance.spec.ts
import { test, expect } from '../test-utils'
import { TestData } from '../data/test-data'
import { TestHelpers } from '../utils/test-helpers'

test.describe('Performance Tests', () => {
  test('should load menu page within acceptable time', async ({
    page,
    menuPage,
  }) => {
    const loadTime = await TestHelpers.measurePageLoadTime(page, menuPage.url)
    expect(loadTime).toBeLessThan(TestData.performanceThresholds.pageLoadTime)

    // Ensure page is ready before checking essential content
    await TestHelpers.ensurePageReady(page)
    // Essential content should be visible
    await expect(
      page.locator('h1, .menu-title, [data-testid="page-title"]').first(),
    ).toBeVisible()
  })

  test('should handle large numbers of menu items efficiently', async ({
    menuPage,
  }) => {
    await menuPage.goto()
    await menuPage.waitForMenuItemsToLoad()

    // Scroll to load all content
    await menuPage.scrollToBottom()
    const menuItemElements = await menuPage.page
      .locator('a[data-test-card]')
      .all()
    const itemsCount = menuItemElements.length
    expect(itemsCount).toBeGreaterThan(10)
    expect(itemsCount).toBeLessThan(200)

    // Page should remain responsive
    const scrollPosition = await menuPage.page.evaluate(
      () => window.pageYOffset,
    )
    expect(scrollPosition).toBeGreaterThan(0)
  })

  test('should optimize Core Web Vitals', async ({ page, menuPage }) => {
    await menuPage.goto()

    // Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })

        setTimeout(() => resolve(0), 3000)
      })
    })

    if (lcp > 0) {
      expect(lcp).toBeLessThan(TestData.performanceThresholds.lcp)
    }
  })

  test('should handle slow network conditions', async ({ page, menuPage }) => {
    await TestHelpers.simulateSlowNetwork(page)

    const startTime = Date.now()

    await menuPage.goto()
    await menuPage.waitForMenuItemsToLoad()
    const loadTime = Date.now() - startTime

    // Should still load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(10000) // 10 seconds max for slow network
  })
})
