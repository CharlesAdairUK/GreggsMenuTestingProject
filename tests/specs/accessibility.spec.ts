// tests/specs/accessibility.spec.ts
import { expect } from "@playwright/test";
import { test, getAccessibilityReport } from "../test-utils";

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ menuPage }) => {
    await menuPage.goto();
    await menuPage.waitForMenuItemsToLoad();
  });

  test('should pass accessibility report', async ({ page }) => {
    const report = await getAccessibilityReport({ page, disableRules: [] });

    expect(report.violations).toHaveLength(0);
  });
});
