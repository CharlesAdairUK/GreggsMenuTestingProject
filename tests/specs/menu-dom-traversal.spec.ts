// tests/specs/menu-dom-traversal.spec.ts
import { test, expect } from '../fixtures/../test-utils'

test.describe('Greggs Menu - Complete DOM Traversal', () => {
  test('should check every menu item across all categories', async ({
    page,
  }) => {
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    // Get all menu items from the DOM
    const allMenuItems = await page.evaluate(() => {
      // Common selectors for menu items on Greggs website
      const itemSelectors = ['a[data-test-card]']

      let items: Element[] = []

      // Try each selector to find menu items
      for (const selector of itemSelectors) {
        const elements = Array.from(document.querySelectorAll(selector))
        if (elements.length > 0) {
          // Filter to only include elements that look like menu items
          const menuItems = elements.filter((el) => {
            const text = el.textContent?.toLowerCase()
            const hasName = el.querySelector(
              'h1, h2, h3, h4, h5, h6, [class*="name"], [class*="title"]',
            )
            // Get image name if available
            const imageElement = el.querySelector('img')
            const imageName =
              imageElement?.getAttribute('alt')?.trim() ||
              imageElement?.getAttribute('title')?.trim() ||
              ''

            // You can use imageName later in the mapping function
            ;(el as any).__imageName = imageName

            return hasName
          })

          if (menuItems.length > 0) {
            items = menuItems
            break
          }
        }
      }

      // Extract data from each menu item
      return items.map((item, index) => {
        const nameElement = item.querySelector(
          'h1, h2, h3, h4, h5, h6, [class*="name"], [class*="title"], [data-testid="name"]',
        )
        const priceElement = item.querySelector(
          '[class*="price"], .cost, [data-testid="price"]',
        )
        const imageElement = item.querySelector('img')
        const descriptionElement = item.querySelector(
          'p, [class*="description"], [data-testid="description"]',
        )
        const allergenElements = item.querySelectorAll(
          '[class*="allergen"], [data-testid="allergen"]',
        )
        const dietaryElements = item.querySelectorAll(
          '[class*="vegan"], [class*="vegetarian"], [class*="dietary"]',
        )

        return {
          index,
          name: nameElement?.textContent?.trim() || 'Unknown Item',
          price: priceElement?.textContent?.trim() || 'No Price',
          imageSrc: (imageElement as HTMLImageElement)?.src || '',
          imageAlt: (imageElement as HTMLImageElement)?.alt || '',
          description: descriptionElement?.textContent?.trim() || '',
          allergenCount: allergenElements.length,
          allergens: Array.from(allergenElements)
            .map((el) => el.textContent?.trim())
            .filter(Boolean),
          dietaryInfo: Array.from(dietaryElements)
            .map((el) => el.textContent?.trim())
            .filter(Boolean),
          element: item.outerHTML.substring(0, 200) + '...', // First 200 chars for debugging
          boundingRect: item.getBoundingClientRect(),
          isVisible:
            (item as HTMLElement).offsetHeight > 0 &&
            (item as HTMLElement).offsetWidth > 0,
        }
      })
    })

    console.log(`Found ${allMenuItems.length} menu items`)

    // Check each menu item
    for (const [index, item] of allMenuItems.entries()) {
      console.log(`\n--- Checking Item ${index + 1}: ${item.name} ---`)

      // 1. Name validation
      expect(item.name, `Item ${index + 1} should have a name`).toBeTruthy()
      expect(
        item.name.length,
        `Item ${index + 1} name should not be too short`,
      ).toBeGreaterThan(2)
      expect(
        item.name,
        `Item ${index + 1} name should not contain placeholder text`,
      ).not.toMatch(/lorem|ipsum|placeholder|test/i)

      // 3. Image validation
      if (item.imageSrc) {
        expect(item.imageSrc).toMatch(
          /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.+)?$/,
        )

        expect(
          item.imageSrc,
          `Item ${index + 1} (${item.name}) should have valid image URL`,
        ).toMatch(/\.(jpg|jpeg|png|webp)/i)
      } else {
        console.warn(`Item ${index + 1} (${item.name}) has no imageSrc`)
      }

      if (item.imageAlt) {
        expect(
          item.imageAlt.length,
          `Item ${index + 1} (${item.name}) alt text should be descriptive`,
        ).toBeGreaterThan(2)
      }

      // 4. Element visibility
      expect(
        item.isVisible,
        `Item ${index + 1} (${item.name}) should be visible`,
      ).toBe(true)
      expect(
        item.boundingRect.width,
        `Item ${index + 1} (${item.name}) should have width`,
      ).toBeGreaterThan(0)
      expect(
        item.boundingRect.height,
        `Item ${index + 1} (${item.name}) should have height`,
      ).toBeGreaterThan(0)

      // 5. Optional content validation
      if (item.description) {
        expect(
          item.description.length,
          `Item ${index + 1} (${item.name}) description should be meaningful`,
        ).toBeGreaterThan(5)
      }

      // 6. Dietary information validation
      if (item.dietaryInfo.length > 0) {
        console.log(`  Dietary info: ${item.dietaryInfo.join(', ')}`)
        for (const dietary of item.dietaryInfo) {
          expect(
            dietary,
            `Item ${index + 1} (${item.name}) dietary info should be valid`,
          ).toMatch(/vegan|vegetarian|gluten.free|dairy.free/i)
        }
      }

      // 7. Allergen information validation
      if (item.allergenCount > 0) {
        console.log(`  Allergens: ${item.allergens.join(', ')}`)
        expect(
          item.allergens.length,
          `Item ${index + 1} (${
            item.name
          }) should have allergen details if allergen count > 0`,
        ).toBeGreaterThan(0)
      }

      console.log(`  ✓ ${item.name} - ${item.price} - Valid`)
    }

    console.log(
      `\n🎉 Successfully validated ${allMenuItems.length} menu items!`,
    )
  })
})

test('should verify menu category selection displays correct section', async ({
  page,
}) => {
  await page.goto('https://www.greggs.com/menu')
  await page.waitForLoadState('networkidle')

  // The expected categories as shown on the Greggs menu page
  const expectedCategories = [
    'All',
    'Breakfast',
    'Savouries & Bakes',
    'Drinks & Snacks',
    'Sandwiches & Salads',
    'Sweet Treats',
    'Hot Food',
  ]

  for (const category of expectedCategories) {
    // Locate the category tab/button by its text
    const tab = page.locator(`[data-test-filter="${category}"]`)

    // Ensure the category tab exists and is visible before interacting
    await expect(
      tab,
      `Category tab for "${category}" should exist and be visible`,
    ).toBeVisible()
    // Click the category tab if visible
    await tab.scrollIntoViewIfNeeded()
    await tab.click()
    await page.waitForTimeout(500) // Wait for UI to update

    // Find the visible section for the selected category
    const section = page
      .locator(
        `[class*="menu-category"]:visible, [class*="MenuCategory"]:visible, [data-testid*="category"]:visible, section:visible`,
      )
      .filter({ hasText: category })

    await expect(
      section,
      `Section for "${category}" should be visible after selecting`,
    ).toBeVisible()

    // Optionally, check that there are menu items in the section
    const items = section.locator(
      'a[data-test-card], .menu-item, .product-card',
    )
    const itemCount = await items.count()
    expect(
      itemCount,
      `Section "${category}" should have menu items`,
    ).toBeGreaterThanOrEqual(1)
  }
})

test('should validate menu item accessibility features', async ({ page }) => {
  await page.goto('https://www.greggs.com/menu')
  await page.waitForLoadState('networkidle')

  const accessibilityData = await page.evaluate(() => {
    // Use the most reliable selector for Greggs menu items
    const items = Array.from(document.querySelectorAll('a[data-test-card]'))

    return items.slice(0, 5).map((item, index) => {
      const img = item.querySelector('img') as HTMLImageElement
      const nameEl = item.querySelector('h1, h2, h3, h4, h5, h6')
      const links = item.querySelectorAll('a, button')

      return {
        index,
        name: nameEl?.textContent?.trim() || 'Unknown',
        hasAltText: img?.alt ? img.alt.length > 0 : false,
        altText: img?.alt || '',
        hasAriaLabel: item.hasAttribute('aria-label'),
        ariaLabel: item.getAttribute('aria-label') || '',
        hasRole: item.hasAttribute('role'),
        role: item.getAttribute('role') || '',
        linkCount: links.length,
        hasHeading: !!nameEl,
        headingLevel: nameEl?.tagName || '',
        tabIndex: item.getAttribute('tabindex'),
        isFocusable: item.matches(
          ':focus, [tabindex], a, button, input, select, textarea',
        ),
      }
    })
  })

  for (const item of accessibilityData) {
    console.log(`\n--- Accessibility Check: ${item.name} ---`)

    // Image alt text
    if (item.hasAltText) {
      expect(item.altText.length).toBeGreaterThan(2)
      expect(item.altText).not.toBe('image')
      console.log(`  ✓ Alt text: "${item.altText}"`)
    }

    // Proper heading structure
    expect(item.hasHeading).toBe(true)
    expect(item.headingLevel).toMatch(/H[1-6]/)
    console.log(`  ✓ Heading: ${item.headingLevel}`)

    // Aria labels or roles where appropriate
    if (item.hasAriaLabel) {
      console.log(`  ✓ ARIA label: "${item.ariaLabel}"`)
    }

    if (item.hasRole) {
      console.log(`  ✓ Role: "${item.role}"`)
    }
  }
})

test('should check menu item interactions', async ({ page }) => {
  await page.goto('https://www.greggs.com/menu')
  await page.waitForLoadState('networkidle')

  // Locate and test individual menu items
  await page.waitForSelector('a[data-test-card]')

  // Get all menu items
  const menuItems = await page.locator('a[data-test-card]').all()
  console.log(`Found ${menuItems.length} menu items`)

  // Test first item
  const firstItem = menuItems[0]
  await firstItem.click()
  // Verify navigation or modal opened
  await page.waitForLoadState('networkidle')

  // Check if modal opened or navigation occurred
  const currentUrl = page.url()
  const modalVisible = await page
    .locator('.modal, [data-testid="modal"], .popup')
    .isVisible()
    .catch(() => false)

  if (modalVisible) {
    console.log('✓ Menu item click opened modal')

    // Check modal content
    const modalContent = page
      .locator('.modal, [data-testid="modal"], .popup')
      .first()
    await expect(modalContent).toBeVisible()

    // Close modal
    const closeButton = modalContent
      .locator('.close, [data-testid="close"], button:has-text("×")')
      .first()
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  } else {
    console.log('⚠ Menu item click had no visible effect')
  }
})

// Helper test to get DOM structure for debugging
test.describe('Menu DOM Structure Analysis', () => {
  test('should analyze DOM structure for debugging', async ({ page }) => {
    await page.goto('https://www.greggs.com/menu')
    await page.waitForLoadState('networkidle')

    const domStructure = await page.evaluate(() => {
      const structure = {
        title: document.title,
        menuContainers: [] as any[],
        allElementsWithPrice: [] as any[],
        allElementsWithImages: [] as any[],
        possibleMenuItems: [] as any[],
      }

      // Find potential menu containers
      const containerSelectors = [
        '.menu',
        '.products',
        '[class*="menu"]',
        '[class*="product"]',
        '[data-*="menu"]',
      ]
      containerSelectors.forEach((selector) => {
        const containers = document.querySelectorAll(selector)
        containers.forEach((container) => {
          structure.menuContainers.push({
            selector,
            className: container.className,
            id: container.id,
            childCount: container.children.length,
          })
        })
      })

      // Find all elements with price indicators
      const priceElements = document.querySelectorAll('*')
      Array.from(priceElements).forEach((el) => {
        if (el.textContent?.includes('£')) {
          structure.allElementsWithPrice.push({
            tagName: el.tagName,
            className: el.className,
            text: el.textContent?.substring(0, 50),
          })
        }
      })

      // Find all images (potential menu item images)
      const images = document.querySelectorAll('img')
      Array.from(images).forEach((img) => {
        structure.allElementsWithImages.push({
          src: img.src,
          alt: img.alt,
          className: img.className,
          parentClassName: img.parentElement?.className,
        })
      })

      return structure
    })

    console.log('DOM Structure Analysis:')
    console.log('Page title:', domStructure.title)
    console.log('Menu containers:', domStructure.menuContainers)
    console.log(
      'Elements with prices:',
      domStructure.allElementsWithPrice.slice(0, 10),
    )
    console.log(
      'Images found:',
      domStructure.allElementsWithImages.slice(0, 10),
    )

    // This test is for debugging - always passes
    expect(domStructure.title).toBeTruthy()
  })
})
