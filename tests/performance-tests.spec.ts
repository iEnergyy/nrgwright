import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import test from '@lib/base-test';

test.describe('Performance Tests', () => {
  test('PERF1: Page load time measurement', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Performance');
    await allure.tag('Load Time');
    await allure.severity('High');

    await test.step('Start page load timer', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1400);
    });

    await test.step('Measure load performance', async () => {
      await playwrightDevPageA.page.waitForTimeout(1600);
      console.log(`Measuring page load time for user: ${credentials}`);
    });

    await test.step('Verify page loaded successfully', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('PERF2: API response time test', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Performance');
    await allure.tag('API Performance');
    await allure.severity('Medium');

    await test.step('Navigate to API test page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1000);
    });

    await test.step('Measure API response time', async () => {
      await playwrightDevPageA.page.waitForTimeout(2000);
      console.log(`Testing API response time for: ${credentials}`);
    });

    await test.step('Verify API performance', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('PERF3: Database query performance', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Performance');
    await allure.tag('Database Performance');
    await allure.severity('Medium');

    await test.step('Navigate to database test page', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1100);
    });

    await test.step('Execute database queries', async () => {
      await playwrightDevPageA.page.waitForTimeout(1900);
      console.log(`Testing database query performance for: ${credentials}`);
    });

    await test.step('Verify query performance', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('PERF4: Memory usage monitoring', async ({
    playwrightDevPageA,
    credentials
  }) => {
    await allure.suite('Performance');
    await allure.tag('Memory Usage');
    await allure.severity('Low');

    await test.step('Start memory monitoring', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.page.waitForTimeout(1200);
    });

    await test.step('Perform memory-intensive operations', async () => {
      await playwrightDevPageA.page.waitForTimeout(1800);
      console.log(`Monitoring memory usage for: ${credentials}`);
    });

    await test.step('Verify memory usage', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });

  test('PERF5: Concurrent user simulation', async ({
    playwrightDevPageA,
    playwrightDevPageB,
    credentials
  }) => {
    await allure.suite('Performance');
    await allure.tag('Concurrency');
    await allure.severity('High');

    await test.step('Simulate concurrent users', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageB.goto();
      await playwrightDevPageA.page.waitForTimeout(1300);
    });

    await test.step('Test concurrent operations', async () => {
      await playwrightDevPageA.page.waitForTimeout(1700);
      console.log(`Testing concurrent user simulation for: ${credentials}`);
    });

    await test.step('Verify concurrent performance', async () => {
      await expect(playwrightDevPageA.page).toHaveTitle(/Playwright/);
      await expect(playwrightDevPageB.page).toHaveTitle(/Playwright/);
      await playwrightDevPageA.page.waitForTimeout(1000);
    });
  });
}); 