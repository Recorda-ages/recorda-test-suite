import { expect, type Locator, type Page } from "@playwright/test";

import type { Locale } from "../support/i18n";

export class LanguagePage {
  readonly root: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("language-settings-screen");
    this.backButton = this.root.getByTestId("language-back");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  option(locale: Locale): Locator {
    return this.root.getByTestId(`language-option-${locale}`);
  }

  async choose(locale: Locale): Promise<void> {
    await this.option(locale).click();
  }
}
