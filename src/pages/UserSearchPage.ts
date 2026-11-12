import { expect, type Locator, type Page } from "@playwright/test";

export class UserSearchPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly suggestions: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("user-search-screen");
    this.backButton = this.root.getByTestId("user-search-back-button");
    this.suggestions = this.root.getByTestId("suggested-profiles");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  suggestion(userId: string): Locator {
    return this.root.getByTestId(`suggested-profile-${userId}`);
  }
}
