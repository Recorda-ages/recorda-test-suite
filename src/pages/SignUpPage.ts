import { expect, type Locator, type Page } from "@playwright/test";

export type SignUpData = {
  name: string;
  username: string;
  email: string;
  password: string;
};

type SignUpField = keyof SignUpData;

export class SignUpPage {
  readonly root: Locator;
  readonly name: Locator;
  readonly username: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("sign-up-screen");
    this.name = this.root.getByTestId("input-name");
    this.username = this.root.getByTestId("input-username");
    this.email = this.root.getByTestId("input-email");
    this.password = this.root.getByTestId("input-password");
    this.submit = this.root.getByTestId("submit-button");
    this.loginLink = this.root.getByTestId("login-link");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** Error message shown under one field (`input-<field>-error`). */
  fieldError(field: SignUpField): Locator {
    return this.root.getByTestId(`input-${field}-error`);
  }

  async fill(data: Partial<SignUpData>): Promise<void> {
    if (data.name !== undefined) await this.name.fill(data.name);
    if (data.username !== undefined) await this.username.fill(data.username);
    if (data.email !== undefined) await this.email.fill(data.email);
    if (data.password !== undefined) await this.password.fill(data.password);
  }

  /** Fills every field and submits. Does not assert where the app goes next. */
  async signUp(data: SignUpData): Promise<void> {
    await this.fill(data);
    await this.submit.click();
  }
}
