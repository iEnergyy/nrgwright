import { test as baseTest } from '@playwright/test';
import { PlaywrightDevPage } from '@pages/example-page';

const test = baseTest.extend<{
  playwrightDevPage: PlaywrightDevPage;
}>({
  playwrightDevPage: async ({ page, context }, use) => {
    await use(new PlaywrightDevPage(page, context));
  },
});

export default test;
