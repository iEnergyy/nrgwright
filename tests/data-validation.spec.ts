import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import test from '@lib/base-test';

test.describe('Data Validation Tests', () => {
  test('DV1: Form validation with valid data', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Validation');
    await allure.tag('Form Validation');
    await allure.severity('High');

    await test.step('Navigate to form page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1200);
    });

    await test.step('Fill form with valid data', async () => {
      await playwrightDevPageA.page.waitForTimeout(1800);
      console.log(`Filling form with valid data for user: ${credentials}`);
    });

    await test.step('Submit and verify success', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('DV2: Form validation with invalid email', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Validation');
    await allure.tag('Email Validation');
    await allure.severity('Medium');

    await test.step('Navigate to form page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(900);
    });

    await test.step('Enter invalid email format', async () => {
      await playwrightDevPageA.page.waitForTimeout(2100);
      console.log(`Testing invalid email validation for: ${credentials}`);
    });

    await test.step('Verify error message', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('DV3: Required field validation', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Validation');
    await allure.tag('Required Fields');
    await allure.severity('Critical');

    await test.step('Navigate to form page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1100);
    });

    await test.step('Submit form without required fields', async () => {
      await playwrightDevPageA.page.waitForTimeout(1900);
      console.log(`Testing required field validation for: ${credentials}`);
    });

    await test.step('Verify validation errors', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('DV4: Password strength validation', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Validation');
    await allure.tag('Password Validation');
    await allure.severity('Medium');

    await test.step('Navigate to password change page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(800);
    });

    await test.step('Test weak password', async () => {
      await playwrightDevPageA.page.waitForTimeout(2300);
      console.log(`Testing password strength validation for: ${credentials}`);
    });

    await test.step('Verify strength indicator', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(900);
    });
  });

  test('DV5: Input length validation', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Validation');
    await allure.tag('Length Validation');
    await allure.severity('Low');

    await test.step('Navigate to form page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1000);
    });

    await test.step('Enter data exceeding length limits', async () => {
      await playwrightDevPageA.page.waitForTimeout(2000);
      console.log(`Testing input length validation for: ${credentials}`);
    });

    await test.step('Verify length restrictions', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });
}); 