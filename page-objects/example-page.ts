import {
  BrowserContext,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { PlaywrightSecondDevPage } from './example-second-page';

export class PlaywrightDevPage {
  readonly page: Page;
  readonly context: BrowserContext;
  readonly getStartedLink: Locator;
  readonly gettingStartedHeader: Locator;
  readonly pomLink: Locator;
  readonly tocList: Locator;
  readonly article: Locator;
  private otherPage: PlaywrightSecondDevPage;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
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
    this.otherPage = new PlaywrightSecondDevPage(this.page, context);
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
      'Page Object Model is a common pattern',
    );
  }

  async useOtherPageObject() {
    await expect(this.otherPage.gettingStartedHeader).toBeVisible();
  }
}
