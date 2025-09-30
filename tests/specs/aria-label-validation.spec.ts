// tests/specs/aria-label-validation.spec.ts
import { test, expect } from '../fixtures/../test-utils'

test.describe('Greggs Menu - ARIA Label Validation', () => {
  test.beforeEach(async ({ page }) => {
    // await TestHelpers.ensurePageReady(page)
    await page.goto('https://www.greggs.com/menu')
    await page.waitForSelector('a[data-test-card]', { timeout: 15000 })
  })

  test('should check aria-label attributes on menu items', async ({ page }) => {
    // Get all menu items
    const menuItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a[data-test-card]'))

      return items.map((item, index) => {
        const link = item as HTMLAnchorElement
        const nameElement = link.querySelector('h3')
        const imageElement = link.querySelector('img')

        return {
          index,
          testCardId: link.getAttribute('data-test-card'),
          name: nameElement?.textContent?.trim() || '',

          // ARIA attributes on the link
          linkAriaLabel: link.getAttribute('aria-label'),
          linkAriaDescribedBy: link.getAttribute('aria-describedby'),
          linkRole: link.getAttribute('role'),

          // ARIA attributes on the image
          imageAriaLabel: imageElement?.getAttribute('aria-label'),
          imageAlt: imageElement?.getAttribute('alt') || '',
          imageAriaHidden: imageElement?.getAttribute('aria-hidden'),

          // Other accessibility attributes
          linkTabIndex: link.getAttribute('tabindex'),
          linkTitle: link.getAttribute('title'),

          // Context for validation
          href: link.getAttribute('href'),
          hasValidName: (nameElement?.textContent?.trim()?.length ?? 0) > 0,
        }
      })
    })

    console.log(`Found ${menuItems.length} menu items to validate`)

    // Validate each menu item's ARIA attributes
    for (const item of menuItems) {
      console.log(
        `\n--- Validating ARIA for: ${item.name} (ID: ${item.testCardId}) ---`,
      )

      // 1. Check if link has proper ARIA labeling
      if (item.linkAriaLabel) {
        expect(
          item.linkAriaLabel.length,
          `Item "${item.name}" aria-label should be descriptive`,
        ).toBeGreaterThan(5)
        expect(
          item.linkAriaLabel,
          `Item "${item.name}" aria-label should not be generic`,
        ).not.toMatch(/^(link|button|image)$/i)
        console.log(`  ✓ Link ARIA label: "${item.linkAriaLabel}"`)
      } else {
        // If no aria-label, the link should be properly labeled by its content
        expect(
          item.hasValidName,
          `Item "${item.name}" should have either aria-label or visible text`,
        ).toBe(true)
        console.log(
          `  ⚠ No link aria-label found, relying on text content: "${item.name}"`,
        )
      }

      // 2. Check image alt text (crucial for screen readers)
      expect(
        item.imageAlt,
        `Item "${item.name}" image should have alt text`,
      ).toBeTruthy()
      expect(
        item.imageAlt.length,
        `Item "${item.name}" alt text should be descriptive`,
      ).toBeGreaterThan(3)
      // Allow up to 2 character mistakes between alt text and item name
      const altText = item.imageAlt.trim().toLowerCase()
      const nameText = item.name.trim().toLowerCase()

      function levenshtein(a: string, b: string): number {
        const dp = Array.from({ length: a.length + 1 }, () =>
          Array(b.length + 1).fill(0),
        )
        for (let i = 0; i <= a.length; i++) dp[i][0] = i
        for (let j = 0; j <= b.length; j++) dp[0][j] = j
        for (let i = 1; i <= a.length; i++) {
          for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
              dp[i][j] = dp[i - 1][j - 1]
            } else {
              dp[i][j] =
                1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
          }
        }
        return dp[a.length][b.length]
      }

      const distance = levenshtein(altText, nameText)
      expect(
        distance,
        `Item "${item.name}" alt text should closely match item name (<=2 character difference)`,
      ).toBeLessThanOrEqual(2)
      console.log(`  ✓ Image alt text: "${item.imageAlt}"`)

      // 3. Check for redundant ARIA labels
      if (item.imageAriaLabel && item.imageAlt) {
        console.log(
          `  ⚠ Both aria-label and alt text present on image for "${item.name}"`,
        )
      }

      // 4. Validate aria-hidden usage on images
      if (item.imageAriaHidden === 'true') {
        expect(
          item.linkAriaLabel || item.hasValidName,
          `If image is aria-hidden for "${item.name}", link must have proper labeling`,
        ).toBeTruthy()
        console.log(`  ✓ Image is aria-hidden, link has proper labeling`)
      }

      // 5. Check for aria-describedby references
      if (item.linkAriaDescribedBy) {
        // Verify the referenced element exists
        const referencedElement = await page
          .locator(`#${item.linkAriaDescribedBy}`)
          .count()
        expect(
          referencedElement,
          `aria-describedby for "${item.name}" should reference existing element`,
        ).toBeGreaterThan(0)
        console.log(
          `  ✓ aria-describedby references: #${item.linkAriaDescribedBy}`,
        )
      }

      // 6. Validate tabindex if present
      if (item.linkTabIndex !== null) {
        const tabIndex = parseInt(item.linkTabIndex || '0')
        expect(
          tabIndex,
          `tabindex for "${item.name}" should not be positive`,
        ).toBeLessThanOrEqual(0)
        console.log(`  ✓ tabindex: ${tabIndex}`)
      }
    }

    console.log(
      `\n🎉 Validated ARIA labels for ${menuItems.length} menu items!`,
    )
  })

  test('should validate navigation landmarks have proper ARIA', async ({
    page,
  }) => {
    const navigationElements = await page.evaluate(() => {
      const elements: Array<{
        type: string
        index: number
        tagName: string
        ariaLabel: string | null
        role?: string | null
        ariaLabelledBy: string | null
        hasHeading?: boolean
        headingText?: string | undefined
      }> = []

      // Check main navigation
      const navs = Array.from(document.querySelectorAll('nav'))
      navs.forEach((nav, index) => {
        elements.push({
          type: 'navigation',
          index,
          tagName: nav.tagName,
          ariaLabel: nav.getAttribute('aria-label'),
          role: nav.getAttribute('role'),
          ariaLabelledBy: nav.getAttribute('aria-labelledby'),
        })
      })

      // Check main content area
      const mains = Array.from(document.querySelectorAll('main, [role="main"]'))
      mains.forEach((main, index) => {
        elements.push({
          type: 'main',
          index,
          tagName: main.tagName,
          ariaLabel: main.getAttribute('aria-label'),
          role: main.getAttribute('role'),
          ariaLabelledBy: main.getAttribute('aria-labelledby'),
        })
      })

      // Check section headers
      const sections = Array.from(document.querySelectorAll('section'))
      sections.forEach((section, index) => {
        const heading = section.querySelector('h1, h2, h3, h4, h5, h6')
        elements.push({
          type: 'section',
          index,
          tagName: section.tagName,
          ariaLabel: section.getAttribute('aria-label'),
          ariaLabelledBy: section.getAttribute('aria-labelledby'),
          hasHeading: !!heading,
          headingText: heading?.textContent?.trim(),
        })
      })

      return elements
    })

    // Validate navigation landmarks
    const navElements = navigationElements.filter(
      (el) => el.type === 'navigation',
    )
    if (navElements.length > 0) {
      for (const nav of navElements) {
        const hasProperLabel = nav.ariaLabel || nav.ariaLabelledBy
        expect(
          hasProperLabel,
          `Navigation element ${nav.index} should have aria-label or aria-labelledby`,
        ).toBeTruthy()
        console.log(
          `Navigation ${nav.index}: ${nav.ariaLabel || 'labeled by ID'}`,
        )
      }
    }

    // Validate main content areas
    const mainElements = navigationElements.filter((el) => el.type === 'main')
    expect(
      mainElements.length,
      'Should have at least one main content area',
    ).toBeGreaterThanOrEqual(1)

    // Validate sections
    const sections = navigationElements.filter((el) => el.type === 'section')
    for (const section of sections) {
      if (
        !section.hasHeading &&
        !section.ariaLabel &&
        !section.ariaLabelledBy
      ) {
        console.log(`⚠ Section ${section.index} lacks proper labeling`)
      }
    }
  })

  test('should check menu item interaction states have ARIA support', async ({
    page,
  }) => {
    // Get the first few menu items for interaction testing
    const menuItems = await page.locator('a[data-test-card]').all()
    const itemsToTest = Math.min(menuItems.length, 3)

    for (let i = 0; i < itemsToTest; i++) {
      const item = menuItems[i]
      const testId = await item.getAttribute('data-test-card')

      // Test hover state
      await item.hover()

      // Check for ARIA state attributes that might be added on interaction
      const interactionAria = await item.evaluate((element) => {
        return {
          ariaExpanded: element.getAttribute('aria-expanded'),
          ariaPressed: element.getAttribute('aria-pressed'),
          ariaSelected: element.getAttribute('aria-selected'),
          ariaCurrent: element.getAttribute('aria-current'),
        }
      })

      // Report missing ARIA attributes
      const missingAria: string[] = []
      for (const key of Object.keys(interactionAria)) {
        if (interactionAria[key as keyof typeof interactionAria] === null) {
          missingAria.push(key)
        }
      }
      if (missingAria.length > 0) {
        console.log(
          `⚠ Menu item ${testId} is missing ARIA attributes: ${missingAria.join(
            ', ',
          )}`,
        )
      }

      // If any ARIA states are present, validate they have appropriate values
      for (const [key, value] of Object.entries(interactionAria)) {
        if (value !== null) {
          switch (key) {
            case 'ariaExpanded':
            case 'ariaPressed':
            case 'ariaSelected':
              expect(['true', 'false']).toContain(value)
              break
            case 'ariaCurrent':
              expect([
                'page',
                'step',
                'location',
                'date',
                'time',
                'true',
                'false',
              ]).toContain(value)
              break
            default:
              break
          }
        }
      }

      // If any ARIA states are present, validate they have appropriate values
      if (interactionAria.ariaExpanded !== null) {
        expect(
          ['true', 'false'].includes(interactionAria.ariaExpanded),
          `aria-expanded for item ${testId} should be "true" or "false"`,
        ).toBe(true)
      }

      console.log(`Item ${testId} interaction ARIA states:`, interactionAria)
    }
  })

  test('should validate form elements have proper ARIA labels', async ({
    page,
  }) => {
    // Check for search inputs or filter controls
    const formElements = await page.evaluate(() => {
      const elements: any[] = []

      // Input elements
      const inputs = Array.from(document.querySelectorAll('input'))
      inputs.forEach((input, index) => {
        const associatedLabel = document.querySelector(
          `label[for="${input.id}"]`,
        )
        elements.push({
          type: 'input',
          index,
          inputType: input.type,
          id: input.id,
          ariaLabel: input.getAttribute('aria-label'),
          ariaLabelledBy: input.getAttribute('aria-labelledby'),
          ariaDescribedBy: input.getAttribute('aria-describedby'),
          placeholder: input.getAttribute('placeholder'),
          hasAssociatedLabel: !!associatedLabel,
          labelText: associatedLabel?.textContent?.trim(),
          required: input.hasAttribute('required'),
          ariaRequired: input.getAttribute('aria-required'),
        })
      })

      // Button elements
      const buttons = Array.from(document.querySelectorAll('button'))
      buttons.forEach((button, index) => {
        elements.push({
          type: 'button',
          index,
          ariaLabel: button.getAttribute('aria-label'),
          ariaLabelledBy: button.getAttribute('aria-labelledby'),
          ariaDescribedBy: button.getAttribute('aria-describedby'),
          textContent: button.textContent?.trim(),
          ariaExpanded: button.getAttribute('aria-expanded'),
          ariaPressed: button.getAttribute('aria-pressed'),
        })
      })

      return elements
    })

    // Validate input elements
    const inputs = formElements.filter((el) => el.type === 'input')
    for (const input of inputs) {
      const hasProperLabeling =
        input.ariaLabel ||
        input.ariaLabelledBy ||
        input.hasAssociatedLabel ||
        input.placeholder
      expect(
        hasProperLabeling,
        `Input element ${input.index} (type: ${input.inputType}) should have proper labeling`,
      ).toBeTruthy()

      if (input.required && input.ariaRequired !== 'true') {
        console.log(
          `⚠ Required input ${input.index} should have aria-required="true"`,
        )
      }

      console.log(
        `Input ${input.index}: ${
          input.ariaLabel || input.labelText || input.placeholder
        }`,
      )
    }

    // Validate button elements
    const buttons = formElements.filter((el) => el.type === 'button')
    for (const button of buttons) {
      const hasProperLabeling =
        button.ariaLabel ||
        button.ariaLabelledBy ||
        (button.textContent && button.textContent.length > 0)
      expect(
        hasProperLabeling,
        `Button element ${button.index} should have proper labeling`,
      ).toBeTruthy()

      console.log(
        `Button ${button.index}: ${button.ariaLabel || button.textContent}`,
      )
    }
  })

  test('should check for missing ARIA labels and suggest improvements', async ({
    page,
  }) => {
    const accessibilityIssues = await page.evaluate(() => {
      interface AccessibilityIssue {
        element: string
        index: number
        className: string
        id?: string
        issue: string
        suggestion: string
      }

      const issues: AccessibilityIssue[] = []

      // Check all interactive elements
      const interactiveElements = Array.from(
        document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      )

      interactiveElements.forEach((element, index) => {
        const tagName = element.tagName.toLowerCase()
        const ariaLabel = element.getAttribute('aria-label')
        const ariaLabelledBy = element.getAttribute('aria-labelledby')
        const textContent = element.textContent?.trim()

        // Check for proper labeling
        let hasProperLabel = false
        let labelSource = ''

        if (ariaLabel) {
          hasProperLabel = true
          labelSource = 'aria-label'
        } else if (ariaLabelledBy) {
          hasProperLabel = true
          labelSource = 'aria-labelledby'
        } else if (tagName === 'a' && textContent) {
          hasProperLabel = true
          labelSource = 'text content'
        } else if (tagName === 'button' && textContent) {
          hasProperLabel = true
          labelSource = 'text content'
        } else if (tagName === 'input') {
          const input = element as HTMLInputElement
          const associatedLabel = document.querySelector(
            `label[for="${input.id}"]`,
          )
          const placeholder = input.getAttribute('placeholder')

          if (associatedLabel || placeholder) {
            hasProperLabel = true
            labelSource = associatedLabel ? 'associated label' : 'placeholder'
          }
        }

        if (!hasProperLabel) {
          issues.push({
            element: tagName,
            index,
            className: element.className,
            id: element.id,
            issue: 'Missing accessible label',
            suggestion: `Add aria-label or ensure ${tagName} has descriptive text content`,
          })
        }

        // Check for generic or poor labels
        if (
          ariaLabel &&
          ['link', 'button', 'image', 'menu'].includes(ariaLabel.toLowerCase())
        ) {
          issues.push({
            element: tagName,
            index,
            className: element.className,
            issue: `Generic aria-label: "${ariaLabel}"`,
            suggestion: 'Use more descriptive aria-label text',
          })
        }
      })

      return issues
    })

    // Report accessibility issues
    if (accessibilityIssues.length > 0) {
      console.log(
        `\n⚠ Found ${accessibilityIssues.length} accessibility issues:`,
      )
      accessibilityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.element} - ${issue.issue}`)
        console.log(`   Suggestion: ${issue.suggestion}`)
        if (issue.className) console.log(`   Class: ${issue.className}`)
        if (issue.id) console.log(`   ID: ${issue.id}`)
        console.log('')
      })

      // Don't fail the test but report issues for improvement
      expect(
        accessibilityIssues.length,
        'Consider addressing accessibility issues for better user experience',
      ).toBeLessThan(50)
    } else {
      console.log('✅ No major ARIA labeling issues found!')
    }
  })
})
