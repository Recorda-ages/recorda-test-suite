import { expect, type Locator, type Page } from "@playwright/test";

import { FollowButton } from "./components/FollowButton";
import { ProfileDetails } from "./components/ProfileDetails";

/** Someone else's profile (the signed-in user's own profile is `ProfilePage`). */
export class UserProfilePage {
  readonly root: Locator;
  readonly header: Locator;
  readonly details: ProfileDetails;

  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId("user-profile-screen");
    this.header = this.root.getByTestId("profile-header");
    this.details = new ProfileDetails(this.root);
  }

  /** The big Seguir / Solicitado / Seguindo button of the profile. */
  followButton(userId: string): FollowButton {
    return new FollowButton(this.root, this.page, userId);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
