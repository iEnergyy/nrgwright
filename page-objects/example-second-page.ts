import {
  BrowserContext,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

export class PlaywrightSecondDevPage {
  readonly page: Page;
  readonly context: BrowserContext;
  readonly getStartedLink: Locator;
  readonly gettingStartedHeader: Locator;
  readonly pomLink: Locator;
  readonly tocList: Locator;
  readonly article: Locator;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.getStartedLink = page.locator('a', { hasText: 'Get started' });
    this.gettingStartedHeader = page.locator('h1', { hasText: 'Installation' });
    this.pomLink = page
      .locator('li', {
        hasText: 'Guides',
      })
      .locator('a', {
        hasText: 'Page Object Model',
      });
    this.tocList = page.locator('article div.markdown ul > li > a');
    this.article = page.locator('article');
  }

  async goto() {
    await this.page.goto('https://playwright.dev');
  }

  async getStarted() {
    await this.getStartedLink.first().click();
    await expect(this.gettingStartedHeader).toBeVisible();
  }

  async pageObjectModel() {
    await this.getStarted();
    await this.pomLink.click();
  }

  async verifyArticle() {
    await expect(this.article).toContainText(
      'Page Object Model is a commonn pattern',
    );
  }
}
