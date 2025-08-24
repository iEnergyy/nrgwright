import { expect } from '@playwright/test';
import test from '@lib/base-test';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Dummy Test Suite 5', () => {
  test('Dummy test 1 - 2.8 seconds', async () => {
    await sleep(2800);
    expect(30 + 20).toBe(50);
  });

  test('Dummy test 2 - FAILING - 4.3 seconds', async () => {
    await sleep(4300);
    expect('fail').toBe('pass'); // This will always fail
  });

  test('Dummy test 3 - 3.6 seconds', async () => {
    await sleep(3600);
    expect([1, 2, 3, 4, 5]).toContain(4);
  });

  test('Dummy test 4 - 5.2 seconds', async () => {
    await sleep(5200);
    expect(12 * 12).toBe(144);
  });

  test('Dummy test 5 - 10 seconds', async () => {
    await sleep(10000);
    expect('dummy test').toMatch('dummy');
  });
});
