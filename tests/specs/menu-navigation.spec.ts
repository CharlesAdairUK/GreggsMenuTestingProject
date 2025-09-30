// tests/specs/menu-navigation.spec.ts
import { test, expect } from '../fixtures/../test-utils'
import { TestData } from '../data/test-data'

test.describe('Menu Display Tests', () => {
  test.beforeEach(async ({ menuPage, page }) => {
    await menuPage.goto()
    await menuPage.waitForMenuItemsToLoad()
  })

  test('should display all main menu categories', async ({ menuPage }) => {
    const visibleCategories = await menuPage.getAllCategoryNames()
    console.log('Visible Categories:', visibleCategories)

    expect(visibleCategories).toEqual(TestData.categories)
  })

  test('should navigate to category sections when clicked', async ({
    menuPage,
  }) => {
    const breakfastSection = await menuPage.getCategorySection('Breakfast')
    const [breakfastButton, breakfastSectionElement] = await Promise.all([
      menuPage.page.getByRole('button', { name: 'Breakfast' }),
      menuPage.page
        .locator('section')
        .filter({ hasText: 'BreakfastBacon Breakfast' }),
    ])

    await breakfastButton.click()
    await expect(breakfastSectionElement).toBeVisible()
  })

  test('should maintain active state for current menu section', async ({
    menuPage,
  }) => {
    await menuPage.clickCategory('Savouries & Bakes')

    // Verify category is highlighted or has active state
    const activeCategoryIndicator = menuPage.page.locator(
      '.active, [aria-current="page"], .current',
    )
    await expect(activeCategoryIndicator.first()).toBeVisible()
  })

  test('should return to homepage when logo is clicked', async ({
    menuPage,
  }) => {
    await menuPage.clickLogo()
    await expect(menuPage.page).toHaveURL(/.*greggs\.com\/?$/)
  })

  test('should support keyboard navigation', async ({ menuPage }) => {
    // Store the URL before pressing Enter
    const previousUrl = menuPage.page.url()
    await menuPage.page.keyboard.press('Tab')
    await menuPage.page.keyboard.press('Enter')
    await menuPage.page.keyboard.press('Tab')
    await menuPage.page.waitForTimeout(1000)
    // const focusedElement = menuPage.page.locator(":focus");
    // await expect(focusedElement).toBeVisible();
    await menuPage.page.keyboard.press('Enter')

    // Wait for possible navigation or change
    await menuPage.page.waitForLoadState('networkidle')

    // Check that the URL has changed or the focused element is activated
    const currentUrl = await menuPage.page.url()
    expect(currentUrl).not.toBe(previousUrl)
  })
})
