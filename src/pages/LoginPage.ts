import { expect, type Locator, type Page } from "@playwright/test";

import type { TestUser } from "../data/users";

export class LoginPage {
  readonly root: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  /**
   * The form-level error has no testID yet; it is the only live region on the screen.
   * TODO(frontend): add `testID="auth-form-error"` to AuthFormError and use it here.
   */
  readonly formError: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("login-screen");
    this.username = page.getByTestId("input-username");
    this.password = page.getByTestId("input-password");
    this.submit = page.getByTestId("submit-button");
    this.signUpLink = page.getByTestId("sign-up-link");
    this.forgotPasswordLink = page.getByTestId("forgot-password-link");
    this.formError = this.root.locator('[aria-live="polite"]');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async fill(credentials: Pick<TestUser, "username" | "password">): Promise<void> {
    await this.username.fill(credentials.username);
    await this.password.fill(credentials.password);
  }

  /** Fills the form and submits it. Does not assert where the app goes next. */
  async signIn(credentials: Pick<TestUser, "username" | "password">): Promise<void> {
    await this.fill(credentials);
    // The button is disabled until the form validates (react-hook-form, mode onChange).
    await expect(this.submit).toBeEnabled();
    await this.submit.click();
  }
}
