import { test as base } from "@playwright/test";

import { env } from "../config/env";
import { FeedPage, LoginPage, ProfilePage, SettingsPage } from "../pages";
import { RecordaApi } from "../support/api";
import { App } from "../support/app";

type Fixtures = {
  /** Backend client for arranging data and checking side effects. */
  api: RecordaApi;
  /** Multi-screen navigation (launch, sign in, go to settings…). */
  app: App;
  loginPage: LoginPage;
  feedPage: FeedPage;
  profilePage: ProfilePage;
  settingsPage: SettingsPage;
};

/**
 * Import `test` and `expect` from here, never from `@playwright/test`, so every spec gets
 * the same fixtures. Fixtures are lazy: a test only pays for the ones it destructures.
 *
 * Authentication is NOT a fixture: it comes from the project's `storageState`
 * (see `playwright.config.ts`). Override it per file with
 * `test.use({ storageState: storageStateOf(users.admin) })` or `signedOut`.
 */
export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: env.apiURL });
    await use(new RecordaApi(request));
    await request.dispose();
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  feedPage: async ({ page }, use) => use(new FeedPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
  settingsPage: async ({ page }, use) => use(new SettingsPage(page)),

  app: async ({ page, loginPage, feedPage, profilePage, settingsPage }, use) => {
    await use(new App(page, { loginPage, feedPage, profilePage, settingsPage }));
  }
});

export { expect } from "@playwright/test";
