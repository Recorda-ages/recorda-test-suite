import { expect, type Locator, type Page } from "@playwright/test";

import { FollowButton } from "./components/FollowButton";

/** Search for people by username, opened from the Feed header. */
export class UserSearchPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly input: Locator;
  /** "Sugestões para você": people with musical affinity, shown before typing. */
  readonly suggestions: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("user-search-screen");
    this.backButton = this.root.getByTestId("user-search-back-button");
    this.input = this.root.getByTestId("user-search-input");
    this.suggestions = this.root.getByTestId("suggested-profiles");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** A search result row (`user-search-result-<id>`). */
  resultRow(userId: string): Locator {
    return this.root.getByTestId(`user-search-result-${userId}`);
  }

  /** The follow button of a search result. */
  followButton(userId: string): FollowButton {
    return new FollowButton(this.resultRow(userId), this.page, userId);
  }

  /** Every suggested profile, in the order shown. */
  suggestionItems(): Locator {
    return this.suggestions.locator('[data-testid^="suggested-profile-"]');
  }

  /** The follow toggle of a suggestion. */
  suggestionFollow(userId: string): Locator {
    return this.suggestions.getByTestId(`suggested-follow-${userId}`);
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
