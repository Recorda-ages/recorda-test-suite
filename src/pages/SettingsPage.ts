import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

export type Privacy = "private" | "public";

export class SettingsPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly accountButton: Locator;
  readonly musicPreferencesButton: Locator;
  readonly languageButton: Locator;
  readonly privacySwitch: Locator;
  readonly notice: Locator;
  readonly signOutButton: Locator;
  readonly signOutDialog: Locator;
  readonly confirmSignOutButton: Locator;
  readonly cancelSignOutButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("settings-screen");
    this.backButton = this.root.getByRole("button", { name: t("settings.back") });
    this.accountButton = this.root.getByRole("button", { name: t("settings.account") });
    this.musicPreferencesButton = this.root.getByRole("button", { name: t("settings.music") });
    this.languageButton = this.root.getByRole("button", { name: t("settings.language") });
    this.privacySwitch = this.root.getByRole("switch", { name: t("settings.privateAccount") });
    this.notice = this.root.getByTestId("settings-success-notice");
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

  /** Text under "Conta privada", which says who sees the Recordas. */
  privacySupport(privacy: Privacy): Locator {
    const key = privacy === "private" ? "settings.privateSupport" : "settings.publicSupport";
    return this.root.getByText(t(key));
  }

  /**
   * Confirmation shown before the privacy changes. A Modal without a testID, so it is found by
   * its role and title.
   * TODO(frontend): add a testID to the privacy ConfirmationDialog in SettingsScreen.
   */
  privacyDialog(privacy: Privacy): Locator {
    return this.page
      .getByRole("dialog")
      .filter({ hasText: t(`settings.confirm.${privacy}.title`) });
  }

  async changePrivacy(privacy: Privacy, answer: "confirm" | "cancel"): Promise<void> {
    await this.privacySwitch.click();
    const dialog = this.privacyDialog(privacy);
    await expect(dialog).toBeVisible();
    const button = answer === "confirm" ? t("settings.confirmAction") : t("settings.cancel");
    await dialog.getByRole("button", { name: button, exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
    await expect(this.signOutDialog).toBeVisible();
    await this.confirmSignOutButton.click();
  }
}
