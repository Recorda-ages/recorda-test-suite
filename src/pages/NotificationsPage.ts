import { expect, type Locator, type Page } from "@playwright/test";

import type { NotificationType as ApiNotificationType } from "../support/api";
import { t } from "../support/i18n";

/** Notification kinds shown with "<username> <description>" (content removal has no sender). */
export type NotificationType = Exclude<ApiNotificationType, "CONTENT_REMOVED">;

/** Row testIDs are `notification-<id>`; the rows' own buttons and thumbnails share the prefix. */
const ROW_OR_PART = '[data-testid^="notification-"]';

export class NotificationsPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly list: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("notifications-screen");
    this.backButton = this.root.getByRole("button", { name: t("notifications.back") });
    this.list = this.root.getByTestId("notifications-list");
    this.emptyState = this.root.getByTestId("notifications-empty");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** What a row says: "<username> <description>", e.g. "ana curtiu sua publicação". */
  static message(username: string, type: NotificationType): string {
    return `${username} ${t(`notifications.types.${type}`)}`;
  }

  /**
   * Rows saying that `username` did `type`. Only the row itself contains the message: its
   * thumbnail and Accept/Decline buttons share the testID prefix but not the text.
   */
  rows(username: string, type: NotificationType): Locator {
    return this.list
      .locator(ROW_OR_PART)
      .filter({ hasText: NotificationsPage.message(username, type) });
  }

  /** Every row of a type, whoever sent it. */
  rowsOfType(type: NotificationType): Locator {
    return this.list
      .locator(ROW_OR_PART)
      .filter({ hasText: t(`notifications.types.${type}`) });
  }

  /** Every row that mentions one of `usernames`, in the order the list shows them. */
  rowsOf(usernames: readonly string[]): Locator {
    const escaped = usernames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return this.list.locator(ROW_OR_PART).filter({ hasText: new RegExp(escaped.join("|")) });
  }

  acceptButton(row: Locator): Locator {
    return row.getByRole("button", { name: t("notifications.accept") });
  }

  declineButton(row: Locator): Locator {
    return row.getByRole("button", { name: t("notifications.decline") });
  }

  /** Thumbnail of the Recorda the notification is about (likes, comments, mentions). */
  thumbnail(row: Locator): Locator {
    return row.getByTestId(/^notification-thumbnail-/);
  }
}
