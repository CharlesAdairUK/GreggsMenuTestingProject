// tests/fixtures/test-fixtures.ts
import { test as base, Page } from '@playwright/test';
import { MenuPage } from '../pages/MenuPage';
import { MenuItemModal } from '../pages/MenuItemModal';
type TestFixtures = {
menuPage: MenuPage;
menuItemModal: MenuItemModal;
};
export const test = base.extend<TestFixtures>({
menuPage: async ({ page }, use) => {
const menuPage = new MenuPage(page);
await use(menuPage);
},
menuItemModal: async ({ page }, use) => {
const menuItemModal = new MenuItemModal(page);
await use(menuItemModal);
}
});
export { expect } from '@playwright/test';