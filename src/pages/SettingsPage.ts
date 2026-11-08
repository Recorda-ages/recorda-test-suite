import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

export class SettingsPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly signOutButton: Locator;
  readonly signOutDialog: Locator;
  readonly confirmSignOutButton: Locator;
  readonly cancelSignOutButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("settings-screen");
    this.backButton = this.root.getByRole("button", { name: t("settings.back") });
    // The dialog is a Modal, rendered in a portal outside `root`, so scoping the row to
    // `root` keeps it from matching the dialog's own "Sair" button.
    this.signOutButton = this.root.getByRole("button", { name: t("settings.signOut") });
    this.signOutDialog = page.getByTestId("sign-out-dialog");
    this.confirmSignOutButton = this.signOutDialog.getByRole("button", {
      name: t("settings.signOut")
    });
    this.cancelSignOutButton = this.signOutDialog.getByRole("button", {
      name: t("settings.cancel")
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
    await expect(this.signOutDialog).toBeVisible();
    await this.confirmSignOutButton.click();
  }
}
