import { expect, type Locator, type Page } from "@playwright/test";

import { ProfileDetails } from "./components/ProfileDetails";

/** Someone else's profile (the signed-in user's own profile is `ProfilePage`). */
export class UserProfilePage {
  readonly root: Locator;
  readonly header: Locator;
  readonly details: ProfileDetails;

  constructor(page: Page) {
    this.root = page.getByTestId("user-profile-screen");
    this.header = this.root.getByTestId("profile-header");
    this.details = new ProfileDetails(this.root);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
