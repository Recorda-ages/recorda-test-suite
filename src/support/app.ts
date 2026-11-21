import { expect, type Page } from "@playwright/test";

import type { TestUser } from "../data/users";
import type {
  FeedPage,
  LoginPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
  SignUpPage
} from "../pages";
import type { TestAccount } from "./api";
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
      notificationsPage: NotificationsPage;
      signUpPage: SignUpPage;
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

    /** Signed out: launches the app and opens Sign Up from the Login screen. */
  async goToSignUp(): Promise<void> {
    await this.launch();
    await this.pages.loginPage.expectLoaded();
    await this.pages.loginPage.signUpLink.click();
    await this.pages.signUpPage.expectLoaded();
  }

  /**
   * Reopens the app signed in as an account created by the test (no saved session file).
   * Replaces whatever session the page had, like another person picking up the phone.
   */
  async launchAs(account: TestAccount): Promise<void> {
    await this.page.goto("/");
    await this.page.evaluate(
      ([keys, token, role]) => {
        localStorage.clear();
        localStorage.setItem(keys.token, token);
        localStorage.setItem(keys.role, role);
      },
      [STORAGE_KEYS, account.session.access_token, account.session.user.role] as const
    );
    await this.launch();
    await this.pages.feedPage.expectLoaded();
  }

  /** Feed → Notifications, through the bell in the feed header. */
  async goToNotifications(): Promise<void> {
    await this.pages.feedPage.notificationsButton.click();
    await this.pages.notificationsPage.expectLoaded();
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

  /** Feed → Profile → Settings. */
  async goToSettings(): Promise<void> {
    await this.goToProfile();
    await this.pages.profilePage.openSettings();
    await this.pages.settingsPage.expectLoaded();
  }
}
