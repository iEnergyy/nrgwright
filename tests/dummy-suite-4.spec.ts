import { expect } from '@playwright/test';
import test from '@lib/base-test';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Dummy Test Suite 4', () => {
  test('Dummy test 1 - 1.8 seconds', async () => {
    await sleep(1800);
    expect(20 / 4).toBe(5);
  });

  test('Dummy test 2 - 3.2 seconds', async () => {
    await sleep(3200);
    expect('test string').toHaveLength(11);
  });

  test('Dummy test 3 - FAILING - 5.8 seconds', async () => {
    await sleep(5800);
    expect(1).toBe(999); // This will always fail
  });

  test('Dummy test 4 - 4.7 seconds', async () => {
    await sleep(4700);
    expect([5, 10, 15]).toHaveLength(3);
  });

  test('Dummy test 5 - 7.5 seconds', async () => {
    await sleep(7500);
    expect(7 * 8).toBe(56);
  });
});
