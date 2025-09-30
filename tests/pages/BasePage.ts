// tests/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test'
export class BasePage {
  readonly page: Page
  readonly url: string
  // Common elements
  readonly logo: Locator
  readonly mainNavigation: Locator
  readonly searchInput: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page, url: string = '') {
    this.page = page
    this.url = url
    // Common locators
    this.logo = page.locator('.HeaderLogo__inner, img[alt*="Greggs"]').first()
    this.mainNavigation = page.locator('nav, [role="navigation"]').first()
    this.searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search"], [data-testid="search"]',
      )
      .first()
    this.loadingSpinner = page.locator(
      '.loading, .spinner, [data-testid="loading"], .nuxtLoading',
    )
  }

  async goto() {
    try {
      await this.page.goto(this.url)
    } catch (error) {
      console.log(`Network error while navigating to ${this.url}:`, error)
      // Fallback: reload the page and try again once
      try {
        await this.page.reload()
        await this.page.goto(this.url)
      } catch (fallbackError) {
        console.log(`Fallback navigation also failed:`, fallbackError)
        // Optionally, you could throw or continue depending on your test strategy
      }
    }
    await this.waitForPageLoad()
  }
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.waitForLoadingToComplete()
  }

  async waitForLoadingToComplete() {
    // Wait for loading spinner to disappear if present
    if ((await this.loadingSpinner.count()) > 0) {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 })
    }
  }
  async clickLogo() {
    await this.logo.click()
    await this.page.waitForLoadState('networkidle')
  }

  async search(searchTerm: string) {
    if ((await this.searchInput.count()) > 0) {
      await this.searchInput.fill(searchTerm)
      await this.page.waitForTimeout(1000) // Wait for search debounce
    }
  }
  // async takeScreenshot(name: string) {
  //   await this.page.screenshot({
  //     path: `screenshots/${name}.png`,
  //     fullPage: true,
  //   })
  // }
  async getPageTitle(): Promise<string> {
    return await this.page.title()
  }
  async getCurrentUrl(): Promise<string> {
    return this.page.url()
  }
}
