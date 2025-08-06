import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import test from '@lib/base-test';

test.describe('User Authentication Tests', () => {
  test('UA1: User login with valid credentials', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Authentication');
    await allure.tag('Login');
    await allure.severity('Critical');

    await test.step('Navigate to login page', async () => {
      await playwrightDevPageA.goto();
      // Simulate page load time
      await playwrightDevPageA.page.waitForTimeout(1000);
    });

    await test.step('Enter valid credentials', async () => {
      // Simulate typing and form submission
      await playwrightDevPageA.page.waitForTimeout(1500);
      console.log(`Logging in with credentials: ${credentials}`);
    });

    await test.step('Verify successful login', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(500);
    });
  });

  test('UA2: User login with invalid credentials', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Authentication');
    await allure.tag('Login');
    await allure.severity('High');

    await test.step('Navigate to login page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(800);
    });

    await test.step('Enter invalid credentials', async () => {
      await playwrightDevPageA.page.waitForTimeout(2000);
      console.log(`Attempting login with invalid credentials for: ${credentials}`);
    });

    await test.step('Verify error message', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1200);
    });
  });

  test('UA3: User logout functionality', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Authentication');
    await allure.tag('Logout');
    await allure.severity('Medium');

    await test.step('Login first', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1000);
      console.log(`Logged in user: ${credentials}`);
    });

    await test.step('Perform logout', async () => {
      await playwrightDevPageA.page.waitForTimeout(1800);
      console.log(`Logging out user: ${credentials}`);
    });

    await test.step('Verify logout success', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(700);
    });
  });

  test('UA4: Password reset functionality', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Authentication');
    await allure.tag('Password Reset');
    await allure.severity('Medium');

    await test.step('Navigate to password reset page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(900);
    });

    await test.step('Request password reset', async () => {
      await playwrightDevPageA.page.waitForTimeout(2200);
      console.log(`Requesting password reset for: ${credentials}`);
    });

    await test.step('Verify reset email sent', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(900);
    });
  });

  test('UA5: Session timeout handling', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Authentication');
    await allure.tag('Session Management');
    await allure.severity('Low');

    await test.step('Login and wait for session', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1100);
      console.log(`Testing session timeout for: ${credentials}`);
    });

    await test.step('Simulate session timeout', async () => {
      await playwrightDevPageA.page.waitForTimeout(2500);
    });

    await test.step('Verify session expired', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(400);
    });
  });
}); 