import { expect } from '@playwright/test';
import test from '@lib/base-test';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Dummy Test Suite 2', () => {
  test('Dummy test 1 - 1.5 seconds', async () => {
    await sleep(1500);
    expect(10 > 5).toBe(true);
  });

  test('Dummy test 2 - FAILING - 7 seconds', async () => {
    await sleep(7000);
    expect(2 + 2).toBe(5); // This will always fail
  });

  test('Dummy test 3 - 3.5 seconds', async () => {
    await sleep(3500);
    expect('test').toContain('t');
  });

  test('Dummy test 4 - 4.5 seconds', async () => {
    await sleep(4500);
    expect([1, 2, 3]).toHaveLength(3);
  });

  test('Dummy test 5 - 8 seconds', async () => {
    await sleep(8000);
    expect(100 / 10).toBe(10);
  });
});
