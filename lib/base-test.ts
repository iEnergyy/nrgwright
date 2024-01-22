import { test as baseTest, BrowserContext, Page } from '@playwright/test';
import { PlaywrightDevPage } from '@pages/example-page';
import { PlaywrightSecondDevPage } from '@pages/example-second-page';

const test = baseTest.extend<{
  browserA: BrowserContext;
  browserB: BrowserContext;
  browserAPage: Page;
  browserBPage: Page;
  playwrightDevPageA: PlaywrightDevPage;
  playwrightSecondDevPageA: PlaywrightSecondDevPage;
  playwrightDevPageB: PlaywrightDevPage;
}>({
  browserA: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
  },
  browserB: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
  },
  browserAPage: async ({ browserA }, use) => {
    const page = await browserA.newPage();
    await use(page);
  },
  browserBPage: async ({ browserB }, use) => {
    const page = await browserB.newPage();
    await use(page);
  },
  playwrightDevPageA: async ({ browserA, browserAPage }, use) => {
    await use(new PlaywrightDevPage(browserAPage, browserA));
  },
  playwrightSecondDevPageA: async ({ browserA, browserAPage }, use) => {
    await use(new PlaywrightDevPage(browserAPage, browserA));
  },
  playwrightDevPageB: async ({ browserB, browserBPage }, use) => {
    await use(new PlaywrightDevPage(browserBPage, browserB));
  },
});

export default test;
