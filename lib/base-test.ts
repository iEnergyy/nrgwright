// import { test as baseTest } from '@playwright/test';
// import { PlaywrightDevPage } from '@pages/example-page';

// const test = baseTest.extend<{
//   playwrightDevPage: PlaywrightDevPage;
// }>({
//   playwrightDevPage: async ({ page, context }, use) => {
//     await use(new PlaywrightDevPage(page, context));
//   },
// });

// export default test;

import { test as baseTest, BrowserContext, Browser } from '@playwright/test';
import { PlaywrightDevPage } from '@pages/example-page';

const test = baseTest.extend<{
  browserA: BrowserContext;
  browserB: BrowserContext;
  playwrightDevPageA: PlaywrightDevPage;
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
  playwrightDevPageA: async ({ browserA }, use) => {
    const page = await browserA.newPage();
    await use(new PlaywrightDevPage(page, browserA));
  },
  playwrightDevPageB: async ({ browserB }, use) => {
    const page = await browserB.newPage();
    await use(new PlaywrightDevPage(page, browserB));
  },
});

export default test;
