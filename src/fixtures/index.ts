import { test as base } from "@playwright/test";

import { env } from "../config/env";
import {
  AccountPage,
  AdminPage,
  FeedPage,
  LanguagePage,
  LoginPage,
  MusicPreferencesPage,
  NotificationsPage,
  OnboardingPage,
  ProfilePage,
  RecordaDetailsPage,
  SettingsPage,
  ShareCardPage,
  SignUpPage,
  UserProfilePage,
  UserSearchPage
} from "../pages";
import { assertHasMetadata } from "../requirements/annotations";
import { RecordaApi, type NewAccount } from "../support/api";
import { App } from "../support/app";
import { storageStateFor } from "../support/session";

type Fixtures = {
  /** Backend client for arranging data and checking side effects. */
  api: RecordaApi;
  /** Multi-screen navigation (launch, sign in, go to settings…). */
  app: App;
  /**
   * A brand-new account with the onboarding answered, for tests that change the account.
   * It writes to the backend: use it only in `@mutates` tests. To open the app signed in as
   * it, add `test.use(signedInAsNewAccount)` to the file or describe.
   */
  newAccount: NewAccount;
  loginPage: LoginPage;
  feedPage: FeedPage;
  profilePage: ProfilePage;
  settingsPage: SettingsPage;
  recordaDetailsPage: RecordaDetailsPage;
  notificationsPage: NotificationsPage;
  adminPage: AdminPage;
  shareCardPage: ShareCardPage;
  userProfilePage: UserProfilePage;
  userSearchPage: UserSearchPage;
  accountPage: AccountPage;
  languagePage: LanguagePage;
  musicPreferencesPage: MusicPreferencesPage;
  signUpPage: SignUpPage;
  onboardingPage: OnboardingPage;
  /** Automatic: fails any test declared without `meta()` (description + requirement). */
  requireMetadata: void;
};

/**
 * Import `test`, `meta` and `expect` from here, never from `@playwright/test`, so every spec
 * gets the same fixtures. Fixtures are lazy: a test only pays for the ones it destructures.
 *
 * Authentication is NOT a fixture: it comes from the project's `storageState`
 * (see `playwright.config.ts`). Override it per file with
 * `test.use({ storageState: storageStateOf(users.admin) })` or `signedOut`.
 *
 * Every test declares its name, description and requirement(s):
 * `test("name", meta({ description: "…", requirement: "RF-04.3" }), async ({ app }) => {…})`.
 */
export const test = base.extend<Fixtures>({
  requireMetadata: [
    async ({}, use, testInfo) => {
      assertHasMetadata(testInfo);
      await use();
    },
    { auto: true }
  ],

  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: env.apiURL });
    await use(new RecordaApi(request));
    await request.dispose();
  },

  newAccount: async ({ api }, use) => {
    await use(await api.createUser("account"));
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  feedPage: async ({ page }, use) => use(new FeedPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
  settingsPage: async ({ page }, use) => use(new SettingsPage(page)),
  recordaDetailsPage: async ({ page }, use) => use(new RecordaDetailsPage(page)),
  notificationsPage: async ({ page }, use) => use(new NotificationsPage(page)),
  adminPage: async ({ page }, use) => use(new AdminPage(page)),
  shareCardPage: async ({ page }, use) => use(new ShareCardPage(page)),
  userProfilePage: async ({ page }, use) => use(new UserProfilePage(page)),
  userSearchPage: async ({ page }, use) => use(new UserSearchPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  languagePage: async ({ page }, use) => use(new LanguagePage(page)),
  musicPreferencesPage: async ({ page }, use) => use(new MusicPreferencesPage(page)),
  signUpPage: async ({ page }, use) => use(new SignUpPage(page)),
  onboardingPage: async ({ page }, use) => use(new OnboardingPage(page)),

  app: async (
    {
      page,
      loginPage,
      feedPage,
      profilePage,
      settingsPage,
      notificationsPage,
      userProfilePage,
      userSearchPage,
      accountPage,
      languagePage,
      musicPreferencesPage,
      signUpPage
    },
    use
  ) => {
    await use(
      new App(page, {
        loginPage,
        feedPage,
        profilePage,
        settingsPage,
        notificationsPage,
        userProfilePage,
        userSearchPage,
        accountPage,
        languagePage,
        musicPreferencesPage,
        signUpPage
      })
    );
  }
});

/** `test.use(signedInAsNewAccount)`: the app opens signed in as the test's `newAccount`. */
export const signedInAsNewAccount: Parameters<typeof test.use>[0] = {
  storageState: async ({ newAccount }, use) => {
    await use(storageStateFor(env.baseURL, newAccount.session));
  }
};

export { meta } from "../requirements/annotations";
export { expect } from "@playwright/test";
