import { expect } from '@playwright/test';
import test from '@lib/base-test';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Dummy Test Suite 1', () => {
  test('Dummy test 1 - 2 seconds', async () => {
    await sleep(2000);
    expect(true).toBe(true);
  });

  test('Dummy test 2 - 3 seconds', async () => {
    await sleep(3000);
    expect(1 + 1).toBe(2);
  });

  test('Dummy test 3 - 4 seconds', async () => {
    await sleep(4000);
    expect('hello').toBe('hello');
  });

  test('Dummy test 4 - FAILING - 5 seconds', async () => {
    await sleep(5000);
    expect(true).toBe(false); // This will always fail
  });

  test('Dummy test 5 - 6 seconds', async () => {
    await sleep(6000);
    expect(5 * 5).toBe(25);
  });
});
