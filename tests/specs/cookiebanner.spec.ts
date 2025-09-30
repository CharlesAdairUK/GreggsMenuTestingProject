import { test, expect } from '@playwright/test'

test('Cookie banner has correct structure and accept all cookies button works', async ({
  page,
}) => {
  // Navigate to the website
  await page.goto('/')

  // Check if cookie banner exists with correct accessibility attributes
  const cookieBanner = page.getByRole('region', { name: 'cookie banner' })
  await expect(cookieBanner).toBeVisible()

  // Check if the dialog exists within the cookie banner with correct accessibility attributes
  const privacyDialog = cookieBanner.getByRole('dialog', { name: 'privacy' })
  await expect(privacyDialog).toBeVisible()

  // Check if all required buttons exist
  const cookieSettingsButton = privacyDialog.getByRole('button', {
    name: /cookie settings/i,
  })
  const acceptAllButton = privacyDialog.getByRole('button', {
    name: /accept all cookies/i,
  })
  const rejectAllButton = privacyDialog.getByRole('button', {
    name: /reject all/i,
  })

  await expect(cookieSettingsButton).toBeVisible()
  await expect(acceptAllButton).toBeVisible()
  await expect(rejectAllButton).toBeVisible()

  // Test the accept all cookies button functionality
  await acceptAllButton.click()

  // After clicking "Accept all cookies", the banner should disappear
  await expect(cookieBanner).not.toBeVisible({ timeout: 1000 })

  // Reload the page
  await page.reload()

  // Verify the cookie banner doesn't appear after reload
  await expect(cookieBanner).not.toBeVisible({ timeout: 5000 })
})
