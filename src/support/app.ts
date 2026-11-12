import { expect, type Page } from "@playwright/test";

import type { TestUser } from "../data/users";
import type {
  AccountPage,
  FeedPage,
  LanguagePage,
  LoginPage,
  MusicPreferencesPage,
  ProfilePage,
  SettingsPage
} from "../pages";

type Pages = {
  loginPage: LoginPage;
  feedPage: FeedPage;
  profilePage: ProfilePage;
  settingsPage: SettingsPage;
  accountPage: AccountPage;
  languagePage: LanguagePage;
  musicPreferencesPage: MusicPreferencesPage;
};

/**
 * Navigation helpers. The app has no URL routing (React Navigation without `linking`):
 * every load starts at "/", shows the Splash for at least 1.5 s, then routes to Login or
 * to the signed-in destination. Deeper screens are reached through the UI, so the
 * multi-step routes live here instead of being repeated in tests.
 */
export class App {
  constructor(
    private readonly page: Page,
    private readonly pages: Pages
  ) {}

  /** Loads the app and waits for the Splash to hand over to Login or Feed. */
  async launch(): Promise<void> {
    await this.page.goto("/");
    // Splash min duration (1.5 s) + session check; generous for a cold Metro bundle.
    await expect(this.pages.loginPage.root.or(this.pages.feedPage.root)).toBeVisible({
      timeout: 30_000
    });
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

  /** Feed → Profile → Settings → Minha conta. */
  async goToAccount(): Promise<void> {
    await this.goToSettings();
    await this.pages.settingsPage.accountButton.click();
    await this.pages.accountPage.expectLoaded();
  }

  /** Feed → Profile → Settings → Idioma. */
  async goToLanguage(): Promise<void> {
    await this.goToSettings();
    await this.pages.settingsPage.languageButton.click();
    await this.pages.languagePage.expectLoaded();
  }

  /** Feed → Profile → Settings → Preferências musicais (first step: artists). */
  async goToMusicPreferences(): Promise<void> {
    await this.goToSettings();
    await this.pages.settingsPage.musicPreferencesButton.click();
    await this.pages.musicPreferencesPage.expectLoaded();
  }
}
