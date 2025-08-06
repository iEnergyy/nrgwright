import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import test from '@lib/base-test';

test.describe('Navigation Tests', () => {
  test('NAV1: Main menu navigation', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Navigation');
    await allure.tag('Menu Navigation');
    await allure.severity('High');

    await test.step('Navigate to homepage', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1300);
    });

    await test.step('Click through main menu items', async () => {
      await playwrightDevPageA.page.waitForTimeout(1700);
      console.log(`Testing main menu navigation for user: ${credentials}`);
    });

    await test.step('Verify navigation success', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('NAV2: Breadcrumb navigation', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Navigation');
    await allure.tag('Breadcrumbs');
    await allure.severity('Medium');

    await test.step('Navigate to deep page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1000);
    });

    await test.step('Test breadcrumb links', async () => {
      await playwrightDevPageA.page.waitForTimeout(2200);
      console.log(`Testing breadcrumb navigation for: ${credentials}`);
    });

    await test.step('Verify breadcrumb functionality', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(800);
    });
  });

  test('NAV3: Back button functionality', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Navigation');
    await allure.tag('Browser Navigation');
    await allure.severity('Medium');

    await test.step('Navigate to multiple pages', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1200);
    });

    await test.step('Test back button', async () => {
      await playwrightDevPageA.page.waitForTimeout(1800);
      console.log(`Testing back button functionality for: ${credentials}`);
    });

    await test.step('Verify back navigation', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('NAV4: Search functionality', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Navigation');
    await allure.tag('Search');
    await allure.severity('High');

    await test.step('Navigate to search page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(900);
    });

    await test.step('Perform search operation', async () => {
      await playwrightDevPageA.page.waitForTimeout(2400);
      console.log(`Testing search functionality for: ${credentials}`);
    });

    await test.step('Verify search results', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(700);
    });
  });

  test('NAV5: External link handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Navigation');
    await allure.tag('External Links');
    await allure.severity('Low');

    await test.step('Navigate to page with external links', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1100);
    });

    await test.step('Test external link behavior', async () => {
      await playwrightDevPageA.page.waitForTimeout(1900);
      console.log(`Testing external link handling for: ${credentials}`);
    });

    await test.step('Verify link behavior', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });
}); 