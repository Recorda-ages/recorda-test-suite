import { expect, type Locator, type Page } from "@playwright/test";

export class AccountPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly name: Locator;
  readonly username: Locator;
  readonly email: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly deleteDialog: Locator;
  readonly cancelDeleteButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("account-screen");
    this.backButton = this.root.getByTestId("account-back");
    this.name = this.root.getByTestId("account-name");
    this.username = this.root.getByTestId("account-username");
    this.email = this.root.getByTestId("account-email");
    this.newPassword = this.root.getByTestId("account-new-password");
    this.confirmPassword = this.root.getByTestId("account-confirm-password");
    this.saveButton = this.root.getByTestId("account-save-button");
    this.deleteButton = this.root.getByTestId("account-delete-button");
    this.deleteDialog = page.getByTestId("delete-account-dialog");
    this.cancelDeleteButton = this.deleteDialog.getByTestId("delete-account-cancel");
    this.confirmDeleteButton = this.deleteDialog.getByTestId("delete-account-confirm");
    this.toast = page.getByTestId("app-toast");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** Validation message shown under a field or for the whole form. */
  error(message: string): Locator {
    return this.root.getByText(message, { exact: true });
  }

  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }
}
