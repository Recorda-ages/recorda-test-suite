import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { ReasonDialog } from "./components/ReasonDialog";

export type AccountStatus = "active" | "suspended";

/** Suspend or reactivate controls, as shown on a user card and on the user detail screen. */
export class AccountModeration {
  readonly suspendButton: Locator;
  readonly reactivateButton: Locator;
  /** "Não é permitido suspender outro administrador." (no controls for admins). */
  readonly adminNotice: Locator;

  constructor(scope: Locator) {
    this.suspendButton = scope.getByTestId("suspend-action-trigger");
    this.reactivateButton = scope.getByTestId("reactivate-action-trigger");
    this.adminNotice = scope.getByTestId("admin-action-notice");
  }
}

/** "Usuários": search accounts, see their status and suspend or reactivate them. */
export class AdminUsersPage {
  readonly root: Locator;
  readonly search: Locator;
  readonly suspendDialog: ReasonDialog;
  readonly reactivateDialog: ReasonDialog;

  constructor(page: Page) {
    this.root = page.getByTestId("admin-users-route");
    this.search = this.root.getByTestId("admin-users-search");
    this.suspendDialog = new ReasonDialog(
      page,
      t("moderation.account.suspendDialogTitle"),
      t("moderation.account.suspendShort")
    );
    this.reactivateDialog = new ReasonDialog(
      page,
      t("moderation.account.reactivateDialogTitle"),
      t("moderation.account.reactivateShort")
    );
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  card(userId: string): Locator {
    return this.root.getByTestId(`admin-user-card-${userId}`);
  }

  /** "Ativa" / "Suspensa" at the top of a card. */
  status(userId: string, status: AccountStatus): Locator {
    return this.card(userId).getByText(t(`admin.users.status.${status}`), { exact: true });
  }

  moderation(userId: string): AccountModeration {
    return new AccountModeration(this.card(userId));
  }

  historyButton(userId: string): Locator {
    return this.root.getByTestId(`admin-user-history-${userId}`);
  }

  async find(username: string): Promise<void> {
    await this.search.fill(username);
  }
}
