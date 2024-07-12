import { test as baseTest, BrowserContext, Page } from '@playwright/test';
import { PlaywrightDevPage } from '@pages/example-page';
import { PlaywrightSecondDevPage } from '@pages/example-second-page';
import axios from 'axios';

const test = baseTest.extend<{
  browserA: BrowserContext;
  browserB: BrowserContext;
  browserAPage: Page;
  browserBPage: Page;
  playwrightDevPageA: PlaywrightDevPage;
  playwrightSecondDevPageA: PlaywrightSecondDevPage;
  playwrightDevPageB: PlaywrightDevPage;
  credentials: string;
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
  credentials: async ({ }, use) => {
    // Use workerIndex as a unique identifier for each worker.
    const fetchUsername =
      await axios.get('http://localhost:3000/random-user')
        .then(response => {
          return response.data.username;
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        })
    const userName = `${fetchUsername}-${test.info().workerIndex}`;
    console.log(`credentials setup - setup fixture from ${userName}`);
    // Initialize user in the database.
    await use(userName);
    // Clean up after the tests are done.
    console.log(`credentials cleanup - teardown fixture ${userName}`);
  },
});

export default test;
