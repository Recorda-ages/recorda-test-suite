import { expect, type Page } from "@playwright/test";

import type { TestUser } from "../data/users";
import type {
  FeedPage,
  LoginPage,
  ProfilePage,
  SettingsPage,
  UserProfilePage,
  UserSearchPage
} from "../pages";
import type { LoginResponse } from "./api";
import { STORAGE_KEYS } from "./session";

/**
 * Navigation helpers. The app has no URL routing (React Navigation without `linking`):
 * every load starts at "/", shows the Splash for at least 1.5 s, then routes to Login or
 * to the signed-in destination. Deeper screens are reached through the UI, so the
 * multi-step routes live here instead of being repeated in tests.
 */
export class App {
  constructor(
    private readonly page: Page,
    private readonly pages: {
      loginPage: LoginPage;
      feedPage: FeedPage;
      profilePage: ProfilePage;
      settingsPage: SettingsPage;
      userProfilePage: UserProfilePage;
      userSearchPage: UserSearchPage;
    }
  ) {}

  /** Loads the app and waits for the Splash to hand over to Login or Feed. */
  async launch(): Promise<void> {
    await this.page.goto("/");
    // Splash min duration (1.5 s) + session check; generous for a cold Metro bundle.
    await expect(this.pages.loginPage.root.or(this.pages.feedPage.root)).toBeVisible({
      timeout: 30_000
    });
  }

  /**
   * Launches the app signed in as an account the test created (seeded accounts use saved
   * sessions instead, see docs/GUIDELINES.md §3). The session is written to localStorage
   * before the app boots, on this and every later launch of the page.
   */
  async launchAs(session: LoginResponse): Promise<void> {
    await this.page.addInitScript(
      ({ keys, token, role }) => {
        localStorage.setItem(keys.token, token);
        localStorage.setItem(keys.role, role);
      },
      { keys: STORAGE_KEYS, token: session.access_token, role: session.user.role }
    );
    await this.launch();
  }

  /** Launches the app and signs in through the login form. Lands on the Feed. */
  async signInThroughUi(user: TestUser): Promise<void> {
    await this.launch();
    await this.pages.loginPage.expectLoaded();
    await this.pages.loginPage.signIn(user);
    await this.pages.feedPage.expectLoaded();
  }

  /** Feed → Profile, through the bottom tab bar. */
  async goToProfile(): Promise<void> {
    await this.pages.feedPage.tabBar.select("profile");
    await this.pages.profilePage.expectLoaded();
  }

  /** Feed → search → `username`'s profile. */
  async goToUserProfile(username: string): Promise<void> {
    await this.pages.feedPage.searchButton.click();
    await this.pages.userSearchPage.expectLoaded();
    await this.pages.userSearchPage.openProfile(username);
    await this.pages.userProfilePage.expectLoaded();
  }

  /** Feed → Profile → Settings. */
  async goToSettings(): Promise<void> {
    await this.goToProfile();
    await this.pages.profilePage.openSettings();
    await this.pages.settingsPage.expectLoaded();
  }
}
