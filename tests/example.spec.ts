import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import test from '@lib/base-test';

test.describe('Test Suite 1', () => {
  test('TS1TC1: getting started should contain table of contents', async ({
    playwrightDevPageA,
  }) => {
    await allure.suite('Allure Suite');
    await allure.parentSuite('Allure Parent Suite');
    await allure.subSuite('Allure Sub Suite');
    await allure.tag('Smoke test');
    await allure.label('labelName', 'labelValue');
    await allure.link('https://playwright.dev', 'playwright-site'); // link with name
    await allure.issue(
      'Issue Name',
      'https://github.com/allure-framework/allure-js/issues/352',
    );
    await allure.id('420');

    await test.step('Navigation get started', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.getStarted();
    });

    await test.step('Verification', async () => {
      await expect(playwrightDevPageA.tocList).toHaveText([
        `How to install Playwright`,
        `What's Installed`,
        `How to run the example test`,
        `How to open the HTML test report`,
        `Write tests using web first assertions, page fixtures and locators`,
        `Run single test, multiple tests, headed mode`,
        `Generate tests with Codegen`,
        `See a trace of your tests`,
      ]);
    });
  });

  test('TS1TC2: should show Page Object Model article', async ({
    playwrightDevPageA,
  }) => {
    await test.step('Validation on TSC2', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.pageObjectModel();
      await playwrightDevPageA.verifyArticle();
    });
  });
});

test.describe('Test Suite 2', () => {
  test('TS2TC1: getting started should contain table of contents', async ({
    playwrightDevPageA,
  }) => {
    await test.step('Navigation', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.getStarted();
      await playwrightDevPageA.useOtherPageObject();
    });

    await test.step('Verification', async () => {
      await expect(playwrightDevPageA.tocList).toHaveText([
        `How to install Plywright`,
        `What's Installed`,
        `How to run the example test`,
        `How to open the HTML test report`,
        `Write tests using web first assertions, page fixtures and locators`,
        `Run single test, multiple tests, headed mode`,
        `Generate tests with Codegen`,
        `See a trace of your tests`,
      ]);
    });
  });

  test('TS2TC2: should show Page Object Model article', async ({
    playwrightDevPageA,
    playwrightDevPageB,
  }) => {
    await test.step('Validation on TSC2', async () => {
      await playwrightDevPageA.goto();
      await playwrightDevPageA.pageObjectModel();
      await playwrightDevPageA.verifyArticle();
    });
    await test.step('Validation on TSC2 on 2nd browser', async () => {
      await playwrightDevPageB.goto();
      await playwrightDevPageB.pageObjectModel();
      await playwrightDevPageB.verifyArticle();
    });
  });
});
