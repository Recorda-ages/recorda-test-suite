import type { Locator } from "@playwright/test";

import { env } from "../../src/config/env";
import { users } from "../../src/data/users";
import { expect, meta, signedInAsNewAccount, test } from "../../src/fixtures";
import type { FeedPage } from "../../src/pages";
import { tIn, type Locale } from "../../src/support/i18n";
import { signedOutWithLanguage, STORAGE_KEYS } from "../../src/support/session";

function feedTab(feedPage: FeedPage, locale: Locale) {
  return feedPage.root.getByRole("tab", { name: tIn(locale, "feed.tabs.geral") });
}

const COPY = {
  feed: ["feed.tabs.geral", "feed.tabs.following"],
  profile: ["profile.tabs.recordas", "profile.tabs.metrics", "profile.tabs.calendar"],
  settings: [
    "settings.title",
    "settings.accountSection",
    "settings.account",
    "settings.privateAccount",
    "settings.publicSupport",
    "settings.preferencesSection",
    "settings.music",
    "settings.musicSupport",
    "settings.language",
    "settings.sessionSection",
    "settings.signOut"
  ],
  language: ["language.title"],
  account: [
    "account.title",
    "account.infoSection",
    "account.passwordSection",
    "account.deleteAccount",
    "account.save"
  ]
} as const;

/** Every key is shown in `locale`, and none of them is left in Portuguese. */
async function expectCopyIn(screen: Locator, locale: Locale, keys: readonly string[]) {
  for (const key of keys) {
    const text = tIn(locale, key);
    await expect(screen.getByText(text, { exact: true }).first(), key).toBeVisible();
    const portuguese = tIn("pt-BR", key);
    if (portuguese !== text) {
      await expect(screen.getByText(portuguese, { exact: true }), key).toHaveCount(0);
    }
  }
}

test.describe("Language chosen in Settings", () => {
  test.use(signedInAsNewAccount);

  test(
    "Portuguese, English and Spanish apply immediately and stay after reopening",
    meta({
      description:
        "Picking English and then Spanish changes the open screen and Settings at once, saves " +
        "the language on the account and keeps it after the app is reopened.",
      requirement: "RF-33.1",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, feedPage, languagePage, settingsPage }) => {
      await app.launch();
      await app.goToLanguage();

      await test.step("English changes the language screen right away", async () => {
        await languagePage.choose("en");
        await expect(
          languagePage.root.getByText(tIn("en", "language.title"), { exact: true })
        ).toBeVisible();
      });

      await test.step("Settings is already in English", async () => {
        await languagePage.backButton.click();
        await expect(
          settingsPage.root.getByText(tIn("en", "settings.title"), { exact: true })
        ).toBeVisible();
        await expect(
          settingsPage.root.getByRole("button", { name: tIn("en", "language.names.en") })
        ).toBeVisible();
      });

      await test.step("Spanish is applied the same way", async () => {
        await settingsPage.root
          .getByRole("button", { name: tIn("en", "settings.language") })
          .click();
        await languagePage.choose("es");
        await expect(
          languagePage.root.getByText(tIn("es", "language.title"), { exact: true })
        ).toBeVisible();
        await expect.poll(async () => (await api.settings(newAccount.session)).language).toBe("es");
      });

      await test.step("the app reopens in Spanish", async () => {
        await app.launch();
        await expect(feedTab(feedPage, "es")).toBeVisible();
      });
    }
  );
});

test.describe("Translated interface", () => {
  test.use(signedInAsNewAccount);

  for (const locale of ["en", "es"] as const) {
    test(
      `feed and settings screens are fully translated to ${locale}`,
      meta({
        description:
          `With the account in ${locale}, the feed, profile, Settings, language and Minha conta ` +
          "screens show their copy in that language, with no Portuguese text left behind.",
        requirement: "RNF-02",
        tag: "@mutates"
      }),
      async ({
        app,
        api,
        newAccount,
        feedPage,
        profilePage,
        settingsPage,
        languagePage,
        accountPage
      }) => {
        await api.updateSettings(newAccount.session, { language: locale });
        await app.launch();

        await test.step("feed", async () => {
          await expectCopyIn(feedPage.root, locale, COPY.feed);
        });

        await test.step("profile", async () => {
          await app.goToProfile();
          await expectCopyIn(profilePage.root, locale, COPY.profile);
        });

        await test.step("settings", async () => {
          await profilePage.root
            .getByRole("button", { name: tIn(locale, "settings.title") })
            .click();
          await settingsPage.expectLoaded();
          await expectCopyIn(settingsPage.root, locale, COPY.settings);
        });

        await test.step("language", async () => {
          await settingsPage.root
            .getByRole("button", { name: tIn(locale, "settings.language") })
            .click();
          await languagePage.expectLoaded();
          await expectCopyIn(languagePage.root, locale, COPY.language);
          await languagePage.backButton.click();
        });

        await test.step("minha conta", async () => {
          await settingsPage.root
            .getByRole("button", { name: tIn(locale, "settings.account") })
            .click();
          await accountPage.expectLoaded();
          await expectCopyIn(accountPage.root, locale, COPY.account);
        });
      }
    );
  }
});

test.describe("Language before and after signing in", () => {
  test.use({ storageState: signedOutWithLanguage(env.baseURL, "en") });

  test(
    "the device language applies before login and the account language after it",
    meta({
      description:
        "With English chosen on the device, the login screen is in English. After signing in " +
        "with an account in Portuguese, the app switches to Portuguese and saves it on the device.",
      requirement: "RF-33.2"
    }),
    async ({ app, page, feedPage, loginPage }) => {
      await test.step("the login screen follows the device language", async () => {
        await app.launch();
        await loginPage.expectLoaded();
        await expect(
          loginPage.root.getByText(tIn("en", "auth.signIn.title"), { exact: true })
        ).toBeVisible();
      });

      await test.step("signing in switches to the account language", async () => {
        await loginPage.signIn(users.gabriel);
        await feedPage.expectLoaded();
        await expect(feedTab(feedPage, "pt-BR")).toBeVisible();
      });

      await test.step("the account language is saved on the device", async () => {
        await expect
          .poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.language))
          .toBe("pt-BR");
        await app.launch();
        await expect(feedTab(feedPage, "pt-BR")).toBeVisible();
      });
    }
  );
});
