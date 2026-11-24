import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { ProfileDetails } from "./components/ProfileDetails";

/** Someone else's profile (the signed-in user's own profile is `ProfilePage`). */
export class UserProfilePage {
  readonly root: Locator;
  readonly header: Locator;
  readonly details: ProfileDetails;
  /** Three dots in the top bar; opens a menu (a Modal, outside `root`) with "Denunciar perfil". */
  readonly moreButton: Locator;
  readonly menu: Locator;
  readonly reportOption: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("user-profile-screen");
    this.header = this.root.getByTestId("profile-header");
    this.details = new ProfileDetails(this.root);
    this.moreButton = this.root.getByRole("button", { name: t("feed.more") });
    this.menu = page.getByTestId("profile-menu");
    this.reportOption = this.menu.getByRole("button", { name: t("profile.report") });
  }

  /** Three dots → "Denunciar perfil". Opens the report dialog. */
  async openReport(): Promise<void> {
    await this.moreButton.click();
    await this.reportOption.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
