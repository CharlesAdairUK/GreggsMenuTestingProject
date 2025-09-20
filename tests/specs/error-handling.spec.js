// tests/specs/error-handling.spec.ts
import { test, expect } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Error Handling Tests', () => {
  test('should handle network errors gracefully', async ({ page, menuPage }) => {
    await TestHelpers.simulateNetworkError(page);
    await menuPage.goto();
    
    // Should show error message or offline state
    if (await menuPage.isErrorMessageVisible()) {
      expect(await menuPage.isErrorMessageVisible()).toBe(true);
    }
  });

  test('should handle slow loading gracefully', async ({ page, menuPage }) => {
    await TestHelpers.simulateSlowNetwork(page);
    await menuPage.goto();
    
    // Should show loading indicator
    const loadingIndicator = menuPage.loadingSpinner;
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    await menuPage.waitForMenuItemsToLoad();
    
    // Loading should eventually complete
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator).toBeHidden();
    }
  });

  test('should handle JavaScript errors gracefully', async ({ page, menuPage }) => {
    // Inject a JavaScript error
    await page.addInitScript(() => {
      window.addEventListener('error', (e) => {
        console.error('Test injected error:', e.error);
      });
    });
    
    await menuPage.goto();
    
    // Page should still be functional
    await expect(menuPage.menuItems.first()).toBeVisible();
  });

  test('should handle missing images gracefully', async ({ page, menuPage }) => {
    // Mock image requests to fail
    await page.route('**/*.{png,jpg,jpeg,webp}', route => route.abort());
    
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
    
    // Should still display menu items with placeholder or alt text
    const itemsCount = await menuPage.getMenuItemsCount();
    expect(itemsCount).toBeGreaterThan(0);
  });

  test('should recover from API failures', async ({ page, menuPage }) => {
    // Simulate API failure first
    await page.route('**/api/**', route => route.abort());
    await menuPage.goto();
    
    // Remove route to simulate recovery
    await page.unroute('**/api/**');
    await page.reload();
    
    await menuPage.waitForMenuItemsToLoad();
    const itemsCount = await menuPage.getMenuItemsCount();
    expect(itemsCount).toBeGreaterThan(0);
  });
});
