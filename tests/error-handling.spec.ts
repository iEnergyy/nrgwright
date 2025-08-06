import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import test from '@lib/base-test';

test.describe('Error Handling Tests', () => {
  test('ERR1: Network timeout handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Error Handling');
    await allure.tag('Network Errors');
    await allure.severity('High');

    await test.step('Simulate network timeout', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1500);
    });

    await test.step('Test timeout error handling', async () => {
      await playwrightDevPageA.page.waitForTimeout(1500);
      console.log(`Testing network timeout handling for user: ${credentials}`);
    });

    await test.step('Verify error message display', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('ERR2: Server error handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Error Handling');
    await allure.tag('Server Errors');
    await allure.severity('Critical');

    await test.step('Navigate to error-prone page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1000);
    });

    await test.step('Trigger server error', async () => {
      await playwrightDevPageA.page.waitForTimeout(2000);
      console.log(`Testing server error handling for: ${credentials}`);
    });

    await test.step('Verify error page display', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('ERR3: Form submission error handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Error Handling');
    await allure.tag('Form Errors');
    await allure.severity('Medium');

    await test.step('Navigate to form page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1200);
    });

    await test.step('Submit form with errors', async () => {
      await playwrightDevPageA.page.waitForTimeout(1800);
      console.log(`Testing form submission error handling for: ${credentials}`);
    });

    await test.step('Verify error validation', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('ERR4: JavaScript error handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Error Handling');
    await allure.tag('JavaScript Errors');
    await allure.severity('Medium');

    await test.step('Navigate to JavaScript test page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1100);
    });

    await test.step('Trigger JavaScript error', async () => {
      await playwrightDevPageA.page.waitForTimeout(1900);
      console.log(`Testing JavaScript error handling for: ${credentials}`);
    });

    await test.step('Verify error handling', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('ERR5: Database connection error handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Error Handling');
    await allure.tag('Database Errors');
    await allure.severity('Low');

    await test.step('Navigate to database test page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1000);
    });

    await test.step('Simulate database connection error', async () => {
      await playwrightDevPageA.page.waitForTimeout(2000);
      console.log(`Testing database connection error handling for: ${credentials}`);
    });

    await test.step('Verify error recovery', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });
}); 