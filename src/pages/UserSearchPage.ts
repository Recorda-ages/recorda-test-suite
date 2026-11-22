import { expect, type Locator, type Page } from "@playwright/test";

/** Search for people by username, opened from the Feed header. */
export class UserSearchPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly input: Locator;
  /** "Sugestões para você": people with musical affinity, shown before typing. */
  readonly suggestions: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("user-search-screen");
    this.backButton = this.root.getByTestId("user-search-back-button");
    this.input = this.root.getByTestId("user-search-input");
    this.suggestions = this.root.getByTestId("suggested-profiles");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  suggestion(userId: string): Locator {
    return this.root.getByTestId(`suggested-profile-${userId}`);
  }

  /** A result row; its accessible name is exactly the username. */
  result(username: string): Locator {
    return this.root.getByRole("button", { name: username, exact: true });
  }

  /** Types `username` and opens that person's profile from the results. */
  async openProfile(username: string): Promise<void> {
    await this.input.fill(username);
    await this.result(username).click();
  }
}
