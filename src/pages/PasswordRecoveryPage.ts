import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

type RecoveryForm = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

export class PasswordRecoveryPage {
  readonly root: Locator;
  readonly email: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly submit: Locator;
  readonly success: Locator;
  /** TODO(frontend): add a testID to AuthFormError, as on LoginPage. */
  readonly formError: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("password-recovery-screen");
    this.email = this.root.getByTestId("input-email");
    this.newPassword = this.root.getByTestId("input-new-password");
    this.confirmPassword = this.root.getByTestId("input-confirm-password");
    this.submit = this.root.getByTestId("submit-button");
    this.success = this.root.getByText(t("auth.passwordRecovery.success"), { exact: true });
    this.formError = this.root.locator('[aria-live="polite"]');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async fill(values: RecoveryForm): Promise<void> {
    await this.email.fill(values.email);
    await this.newPassword.fill(values.newPassword);
    await this.confirmPassword.fill(values.confirmPassword);
  }

  async resetPassword(values: RecoveryForm): Promise<void> {
    await this.fill(values);
    await this.submit.click();
  }
}
