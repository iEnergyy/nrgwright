import { expect } from '@playwright/test';
import test from '@lib/base-test';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Dummy Test Suite 3', () => {
  test('Dummy test 1 - 2.5 seconds', async () => {
    await sleep(2500);
    expect('hello world').toMatch('hello');
  });

  test('Dummy test 2 - 3.8 seconds', async () => {
    await sleep(3800);
    expect(15 * 3).toBe(45);
  });

  test('Dummy test 3 - FAILING - 6.5 seconds', async () => {
    await sleep(6500);
    expect('abc').toBe('xyz'); // This will always fail
  });

  test('Dummy test 4 - 4.2 seconds', async () => {
    await sleep(4200);
    expect([1, 2, 3, 4]).toContain(3);
  });

  test('Dummy test 5 - 9 seconds', async () => {
    await sleep(9000);
    expect(50 - 25).toBe(25);
  });
});
