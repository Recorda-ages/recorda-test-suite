import { test as base } from "@playwright/test";

import { env } from "../config/env";
import {
  FeedPage,
  LoginPage,
  NotificationsPage,
  ProfilePage,
  RecordaDetailPage,
  SettingsPage,
  UserProfilePage
} from "../pages";
import { assertHasMetadata } from "../requirements/annotations";
import { RecordaApi } from "../support/api";
import { App } from "../support/app";

type Fixtures = {
  /** Backend client for arranging data and checking side effects. */
  api: RecordaApi;
  /** Multi-screen navigation (launch, sign in, go to settings…). */
  app: App;
  loginPage: LoginPage;
  feedPage: FeedPage;
  notificationsPage: NotificationsPage;
  profilePage: ProfilePage;
  recordaDetailPage: RecordaDetailPage;
  settingsPage: SettingsPage;
  userProfilePage: UserProfilePage;
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

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  feedPage: async ({ page }, use) => use(new FeedPage(page)),
  notificationsPage: async ({ page }, use) => use(new NotificationsPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
  recordaDetailPage: async ({ page }, use) => use(new RecordaDetailPage(page)),
  settingsPage: async ({ page }, use) => use(new SettingsPage(page)),
  userProfilePage: async ({ page }, use) => use(new UserProfilePage(page)),

  app: async ({ page, loginPage, feedPage, notificationsPage, profilePage, settingsPage }, use) => {
    await use(new App(page, { loginPage, feedPage, notificationsPage, profilePage, settingsPage }));
  }
});

export { meta } from "../requirements/annotations";
export { expect } from "@playwright/test";
