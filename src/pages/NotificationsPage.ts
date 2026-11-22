import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

export type NotificationType = "LIKE" | "COMMENT" | "NEW_FOLLOWER";

export class NotificationsPage {
  readonly root: Locator;
  readonly list: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("notifications-screen");
    this.list = this.root.getByTestId("notifications-list");
    this.emptyState = this.root.getByTestId("notifications-empty");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** Rows (`notification-<id>`) saying that `username` did `type`. */
  rows(username: string, type: NotificationType): Locator {
    return this.list
      .locator('[data-testid^="notification-"]')
      .filter({ hasText: `${username} ${t(`notifications.types.${type}`)}` });
  }

  /** Every row of a type, whoever sent it. */
  rowsOfType(type: NotificationType): Locator {
    return this.list
      .locator('[data-testid^="notification-"]')
      .filter({ hasText: t(`notifications.types.${type}`) });
  }
}
