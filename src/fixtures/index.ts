import { test as base } from "@playwright/test";

import { env } from "../config/env";
import { uniquePreferences } from "../data/music";
import {
  AccountPage,
  FeedPage,
  LanguagePage,
  LoginPage,
  MusicPreferencesPage,
  ProfilePage,
  SettingsPage,
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
   * A brand-new account with the onboarding answered (`uniquePreferences`), for tests that
   * change the account. It writes to the backend: use it only in `@mutates` tests. To open
   * the app signed in as it, add `test.use(signedInAsNewAccount)` to the file or describe.
   */
  newAccount: NewAccount;
  loginPage: LoginPage;
  feedPage: FeedPage;
  profilePage: ProfilePage;
  settingsPage: SettingsPage;
  accountPage: AccountPage;
  languagePage: LanguagePage;
  musicPreferencesPage: MusicPreferencesPage;
  userSearchPage: UserSearchPage;
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
    await use(await api.createAccount({ preferences: uniquePreferences() }));
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  feedPage: async ({ page }, use) => use(new FeedPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
  settingsPage: async ({ page }, use) => use(new SettingsPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  languagePage: async ({ page }, use) => use(new LanguagePage(page)),
  musicPreferencesPage: async ({ page }, use) => use(new MusicPreferencesPage(page)),
  userSearchPage: async ({ page }, use) => use(new UserSearchPage(page)),

  app: async (
    {
      page,
      loginPage,
      feedPage,
      profilePage,
      settingsPage,
      accountPage,
      languagePage,
      musicPreferencesPage
    },
    use
  ) => {
    await use(
      new App(page, {
        loginPage,
        feedPage,
        profilePage,
        settingsPage,
        accountPage,
        languagePage,
        musicPreferencesPage
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
