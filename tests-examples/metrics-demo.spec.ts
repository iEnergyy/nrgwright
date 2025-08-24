import { test, expect } from '@playwright/test';

// Demo test suite showcasing the enhanced metrics system
test.describe('Metrics Demo Suite', () => {

  test('should pass normally', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('should fail with assertion error', async ({ page }) => {
    await page.goto('https://example.com');
    // This will trigger an assertion error
    await expect(page.locator('h1')).toHaveText('Wrong Title');
  });

  test('should be flaky (random failure)', async ({ page }) => {
    await page.goto('https://example.com');

    // Simulate flaky behavior - 30% chance of failure
    const random = Math.random();
    if (random < 0.3) {
      await expect(page.locator('h1')).toHaveText('This will fail randomly');
    } else {
      await expect(page.locator('h1')).toHaveText('Example Domain');
    }
  });

  test('should have multiple assertion errors', async ({ page }) => {
    await page.goto('https://example.com');

    // Multiple assertions that will fail
    await expect(page.locator('h1')).toHaveText('Wrong Title 1');
    await expect(page.locator('p')).toHaveText('Wrong Paragraph');
    await expect(page.locator('a')).toHaveAttribute('href', 'wrong-link');
  });

  test('should timeout', async ({ page }) => {
    // This test will timeout
    await page.goto('https://httpstat.us/200?sleep=10000');
  });

  test('should be skipped', async ({ page }) => {
    test.skip(true, 'This test is intentionally skipped');
    await page.goto('https://example.com');
  });

  test('should retry on failure', async ({ page }) => {
    await page.goto('https://example.com');

    // Simulate intermittent failure that might pass on retry
    const attempt = test.info().retry;
    if (attempt < 2) {
      await expect(page.locator('h1')).toHaveText('Will fail first two attempts');
    } else {
      await expect(page.locator('h1')).toHaveText('Example Domain');
    }
  });

  test('should be slow', async ({ page }) => {
    await page.goto('https://example.com');

    // Simulate slow test execution
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toHaveText('Example Domain');
  });

  test('should test different browser behavior', async ({ page, browserName }) => {
    await page.goto('https://example.com');

    // Different behavior based on browser
    if (browserName === 'chromium') {
      await expect(page.locator('h1')).toHaveText('Example Domain');
    } else if (browserName === 'firefox') {
      // Firefox might behave differently
      await expect(page.locator('h1')).toContainText('Example');
    } else {
      // WebKit
      await expect(page.locator('h1')).toHaveText('Example Domain');
    }
  });
});

// Performance test suite
test.describe('Performance Tests', () => {

  test('should measure page load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('https://example.com');
    const loadTime = Date.now() - startTime;

    // Record custom metric
    console.log(`Page load time: ${loadTime}ms`);

    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('should test memory usage', async ({ page }) => {
    await page.goto('https://example.com');

    // Simulate memory-intensive operation
    await page.evaluate(() => {
      const largeArray = new Array(1000000).fill('test data');
      return largeArray.length;
    });

    await expect(page.locator('h1')).toHaveText('Example Domain');
  });
});

// Error handling test suite
test.describe('Error Handling Tests', () => {

  test('should handle network errors gracefully', async ({ page }) => {
    try {
      await page.goto('https://nonexistent-domain-12345.com');
    } catch (error) {
      // Expected network error
      console.log('Network error handled:', error.message);
    }
  });

  test('should handle element not found', async ({ page }) => {
    await page.goto('https://example.com');

    try {
      await expect(page.locator('#nonexistent-element')).toBeVisible();
    } catch (error) {
      // Expected element not found error
      console.log('Element not found error handled:', error.message);
    }
  });
});
