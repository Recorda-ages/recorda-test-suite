import { expect, type Locator, type Page } from "@playwright/test";

/** Search for people by username, opened from the Feed header. */
export class UserSearchPage {
  readonly root: Locator;
  readonly input: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("user-search-screen");
    this.input = this.root.getByTestId("user-search-input");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
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
