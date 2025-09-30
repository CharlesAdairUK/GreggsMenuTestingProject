// tests/specs/greggs-menu-items-optimized.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Greggs Menu Items - DOM Optimized', () => {
  test('should identify and test each menu item using actual DOM structure', async ({
    page,
  }) => {
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    // Based on the actual DOM structure, menu items are <a> tags with data-test-card attributes
    const menuItems = await page.evaluate(() => {
      // Primary selector: Links with data-test-card (most reliable)
      const menuLinks = Array.from(
        document.querySelectorAll('a[data-test-card]'),
      )

      return menuLinks
        .map((link, index) => {
          const linkElement = link as HTMLAnchorElement

          // Extract data-test-card ID (unique identifier)
          const testCardId = linkElement.getAttribute('data-test-card') || ''

          // Get the h3 element for the product name
          const nameElement = linkElement.querySelector('h3')
          const name = nameElement?.textContent?.trim() || ''

          // Get the image element and its attributes
          const imageElement = linkElement.querySelector('img')
          const imageSrc = imageElement?.getAttribute('src') || ''
          const imageAlt = imageElement?.getAttribute('alt') || ''

          // Get the href for the product link
          const productUrl = linkElement.getAttribute('href') || ''

          // Extract product ID from URL or data-test-card
          const productId =
            testCardId || productUrl.match(/product\/[^-]+-(\d+)/)?.[1] || ''

          // Check if image is loaded (has src)
          const hasValidImage = imageSrc && imageSrc.length > 0

          // Get bounding rect for visibility checks
          const rect = linkElement.getBoundingClientRect()
          const isVisible = rect.width > 0 && rect.height > 0

          return {
            index,
            testCardId,
            productId,
            name,
            productUrl,
            imageSrc,
            imageAlt,
            hasValidImage,
            isVisible,
            element: linkElement,
            // Additional data for validation
            linkClasses: linkElement.className,
            imageWidth: imageElement?.getAttribute('width'),
            imageHeight: imageElement?.getAttribute('height'),
            boundingRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
          }
        })
        .filter(
          (item) =>
            // Filter out invalid items
            item.name && item.name.length > 2 && item.testCardId,
        )
    })

    console.log(
      `Found ${menuItems.length} menu items with data-test-card attributes`,
    )
    expect(menuItems.length).toBeGreaterThan(15) // Should have at least 15 items

    // Test each menu item individually
    for (const item of menuItems) {
      console.log(
        `\n--- Testing Item: ${item.name} (ID: ${item.testCardId}) ---`,
      )

      // 1. Validate unique identifier
      expect(
        item.testCardId,
        `Item "${item.name}" should have data-test-card ID`,
      ).toBeTruthy()
      expect(
        item.testCardId,
        `Item "${item.name}" should have numeric ID`,
      ).toMatch(/^\d+$/)

      // 2. Validate product name
      expect(
        item.name,
        `Item with ID ${item.testCardId} should have a name`,
      ).toBeTruthy()
      expect(
        item.name.length,
        `Item "${item.name}" name should be meaningful`,
      ).toBeGreaterThan(3)
      expect(
        item.name,
        `Item "${item.name}" should not contain HTML entities`,
      ).not.toMatch(/&amp;|&lt;|&gt;/)

      // 3. Validate product URL
      expect(
        item.productUrl,
        `Item "${item.name}" should have product URL`,
      ).toBeTruthy()
      expect(
        item.productUrl,
        `Item "${item.name}" should have valid product URL`,
      ).toMatch(/^\/menu\/product\/[a-z0-9-]+$/)

      // 4. Validate image
      expect(
        item.imageSrc,
        `Item "${item.name}" should have image source`,
      ).toBeTruthy()
      expect(
        item.imageSrc,
        `Item "${item.name}" should have valid image URL`,
      ).toMatch(
        /^https:\/\/articles\.greggs\.co\.uk\/images\/.+\.(png|jpg|jpeg)/,
      )
      expect(
        item.imageAlt,
        `Item "${item.name}" should have alt text`,
      ).toBeTruthy()
      expect(
        item.imageAlt,
        `Item "${item.name}" alt text should be descriptive`,
      ).toEqual(item.name)

      // 5. Validate visibility and layout
      expect(item.isVisible, `Item "${item.name}" should be visible`).toBe(true)
      expect(
        item.boundingRect.width,
        `Item "${item.name}" should have width`,
      ).toBeGreaterThan(100)
      expect(
        item.boundingRect.height,
        `Item "${item.name}" should have height`,
      ).toBeGreaterThan(100)

      console.log(`  ✓ ${item.name} - ID: ${item.testCardId} - Valid`)
    }

    // 6. Test for duplicate IDs
    const testCardIds = menuItems.map((item) => item.testCardId)
    const uniqueIds = new Set(testCardIds)
    expect(
      uniqueIds.size,
      'All menu items should have unique data-test-card IDs',
    ).toBe(testCardIds.length)

    console.log(`\n🎉 Successfully validated ${menuItems.length} menu items!`)
  })

  test('should interact with specific menu items using data-test-card', async ({
    page,
  }) => {
    //await TestHelpers.ensurePageReady(page)
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    // Test interaction with first few items using their data-test-card attribute
    const testCardIds = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[data-test-card]'))
      return links
        .slice(0, 3)
        .map((link) => link.getAttribute('data-test-card'))
    })

    for (const testCardId of testCardIds) {
      if (!testCardId) continue

      console.log(`Testing interaction with item ID: ${testCardId}`)

      // Use data-test-card as the primary selector
      const menuItemLocator = page.locator(`[data-test-card="${testCardId}"]`)

      // Verify the element exists and is visible
      await expect(menuItemLocator).toBeVisible()

      // Test hover interaction
      await menuItemLocator.hover()
      await page.waitForTimeout(500)

      // Get the item name for logging
      const itemName = await menuItemLocator.locator('h3').textContent()
      console.log(`  Hovering over: ${itemName}`)

      // Test click interaction
      await menuItemLocator.click()

      // Check if we navigated to product page or opened modal
      const currentUrl = page.url()
      if (currentUrl.includes('/menu/product/')) {
        console.log(`  ✓ Successfully navigated to product page: ${currentUrl}`)
        await page.goBack()
        await page.waitForLoadState('networkidle')
      } else {
        // Check for modal
        const modal = page.locator('.modal, [data-testid="modal"], .popup')
        if (await modal.isVisible()) {
          console.log(`  ✓ Modal opened for item: ${itemName}`)
          // Close modal
          const closeBtn = modal.locator(
            '.close, [data-testid="close"], button:has-text("×")',
          )
          if (await closeBtn.isVisible()) {
            await closeBtn.click()
          }
        }
      }
    }
  })

  test('should validate menu items in different categories', async ({
    page,
  }) => {
    //await TestHelpers.ensurePageReady(page)
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    // Get items grouped by their likely categories based on name patterns
    const categorizedItems = await page.evaluate(() => {
      const menuLinks = Array.from(
        document.querySelectorAll('a[data-test-card]'),
      )
      const categories: { [key: string]: any[] } = {
        breakfast: [],
        savouries: [],
        sweet: [],
        drinks: [],
        other: [],
      }

      menuLinks.forEach((link) => {
        const nameElement = link.querySelector('h3')
        const name = nameElement?.textContent?.trim().toLowerCase() || ''
        const testCardId = link.getAttribute('data-test-card') || ''

        const item = {
          name: nameElement?.textContent?.trim() || '',
          testCardId,
          url: link.getAttribute('href') || '',
        }

        // Categorize based on name content
        if (
          name.includes('breakfast') ||
          name.includes('bacon') ||
          name.includes('sausage') ||
          name.includes('omelette')
        ) {
          categories.breakfast.push(item)
        } else if (
          name.includes('roll') ||
          name.includes('baguette') ||
          name.includes('wrap') ||
          name.includes('sandwich')
        ) {
          categories.savouries.push(item)
        } else if (
          name.includes('chocolate') ||
          name.includes('croissant') ||
          name.includes('cake') ||
          name.includes('sweet')
        ) {
          categories.sweet.push(item)
        } else if (
          name.includes('coffee') ||
          name.includes('tea') ||
          name.includes('drink') ||
          name.includes('water')
        ) {
          categories.drinks.push(item)
        } else {
          categories.other.push(item)
        }
      })

      return categories
    })

    // Validate each category has items
    console.log('Menu items by category:')
    for (const [category, items] of Object.entries(categorizedItems)) {
      console.log(`  ${category}: ${items.length} items`)

      if (items.length > 0) {
        // Test first item in each category
        const firstItem = items[0]
        const locator = page.locator(
          `[data-test-card="${firstItem.testCardId}"]`,
        )

        await expect(locator).toBeVisible()
        console.log(`    ✓ First ${category} item: ${firstItem.name}`)
      }
    }

    // Validate we have a good distribution
    expect(
      categorizedItems.breakfast.length,
      'Should have breakfast items',
    ).toBeGreaterThan(5)
    expect(
      categorizedItems.savouries.length + categorizedItems.other.length,
      'Should have savoury items',
    ).toBeGreaterThan(10)
  })

  test('should handle missing images gracefully', async ({ page }) => {
    //await TestHelpers.ensurePageReady(page)
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    const itemsWithMissingImages = await page.evaluate(() => {
      const menuLinks = Array.from(
        document.querySelectorAll('a[data-test-card]'),
      )

      return menuLinks
        .map((link) => {
          const nameElement = link.querySelector('h3')
          const imageElement = link.querySelector('img')
          const testCardId = link.getAttribute('data-test-card') || ''

          return {
            name: nameElement?.textContent?.trim() || '',
            testCardId,
            hasSrc: imageElement?.hasAttribute('src') || false,
            srcValue: imageElement?.getAttribute('src') || '',
            hasAlt: imageElement?.hasAttribute('alt') || false,
            altValue: imageElement?.getAttribute('alt') || '',
          }
        })
        .filter((item) => !item.hasSrc || item.srcValue.length === 0)
    })

    if (itemsWithMissingImages.length > 0) {
      console.log(
        `Found ${itemsWithMissingImages.length} items with missing images:`,
      )
      itemsWithMissingImages.forEach((item) => {
        console.log(`  - ${item.name} (ID: ${item.testCardId})`)
      })

      // This shouldn't fail the test but should be logged
      expect(
        itemsWithMissingImages.length,
        'Items with missing images should be minimal',
      ).toBeLessThan(5)
    } else {
      console.log('✓ All menu items have valid images')
    }
  })
})

// Utility test to get all unique selectors for debugging
test.describe('Menu Item Selector Analysis', () => {
  test('should analyze all possible selectors for menu items', async ({
    page,
  }) => {
    //await TestHelpers.ensurePageReady(page)
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    const selectorAnalysis = await page.evaluate(() => {
      return {
        // Primary selector - most reliable
        dataTestCard: document.querySelectorAll('a[data-test-card]').length,

        // Alternative selectors
        menuLinks: document.querySelectorAll('a[href*="/menu/product/"]')
          .length,
        dynamicLinks: document.querySelectorAll(
          'a[data-component="DynamicLink"]',
        ).length,
        linksWithH3: document.querySelectorAll('a h3').length,

        // Get sample data-test-card values
        sampleTestCards: Array.from(
          document.querySelectorAll('a[data-test-card]'),
        )
          .slice(0, 5)
          .map((el) => el.getAttribute('data-test-card')),

        // Get sample product URLs
        sampleUrls: Array.from(
          document.querySelectorAll('a[href*="/menu/product/"]'),
        )
          .slice(0, 5)
          .map((el) => el.getAttribute('href')),
      }
    })

    console.log('Selector Analysis:')
    console.log('- Items with data-test-card:', selectorAnalysis.dataTestCard)
    console.log('- Items with product URLs:', selectorAnalysis.menuLinks)
    console.log('- Items with DynamicLink:', selectorAnalysis.dynamicLinks)
    console.log('- Links with H3 titles:', selectorAnalysis.linksWithH3)
    console.log('- Sample test card IDs:', selectorAnalysis.sampleTestCards)
    console.log('- Sample URLs:', selectorAnalysis.sampleUrls)

    // The most reliable selector should be data-test-card
    expect(selectorAnalysis.dataTestCard).toBeGreaterThan(15)
    expect(selectorAnalysis.dataTestCard).toBe(selectorAnalysis.menuLinks)
  })
})
