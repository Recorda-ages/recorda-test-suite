import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

export type FriendsTab = "followers" | "following";

/**
 * "Amigos": the Seguidores / Seguindo lists of the signed-in user, opened from the profile
 * counters.
 *
 * TODO(frontend): `FriendsScreen` has no root `testID` and `FriendCard` has no `testID` or
 * button role, so locators start at the list (`friends-list`) and rows are found by their
 * "@username" text.
 */
export class FriendsPage {
  readonly list: Locator;
  readonly search: Locator;
  readonly empty: Locator;
  /** "Remover seguidor" confirmation (a Modal). */
  readonly removeDialog: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.list = page.getByTestId("friends-list");
    this.search = page.getByLabel(t("friends.search"), { exact: true });
    this.empty = page.getByText(t("friends.empty"), { exact: true });
    this.removeDialog = page
      .getByRole("dialog")
      .filter({ has: page.getByText(t("friends.removeTitle"), { exact: true }) });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.list).toBeVisible();
  }

  tab(name: FriendsTab): Locator {
    return this.page.getByRole("tab", { name: t(`friends.${name}`), exact: true });
  }

  /** Whether `username` is in the open list. */
  entry(username: string): Locator {
    return this.list.getByText(`@${username}`, { exact: true });
  }

  /**
   * Removes `username` from the followers list, confirming. The card is the innermost element
   * holding both the "@username" and its "Remover" (no testID to target it directly).
   */
  async removeFollower(username: string): Promise<void> {
    const card = this.list
      .locator("div")
      .filter({ hasText: `@${username}` })
      .filter({ has: this.page.getByText(t("friends.remove"), { exact: true }) })
      .last();
    await card.getByText(t("friends.remove"), { exact: true }).click();
    await this.removeDialog.getByText(t("friends.remove"), { exact: true }).click();
    await expect(this.removeDialog).toBeHidden();
  }
}
