import { expect, meta, test } from "../../src/fixtures";
import { STORAGE_KEYS } from "../../src/support/session";
import { LOCALE, t } from "../../src/support/i18n";

/**
 * First end-to-end user flow: a returning user opens the app, lands on the feed with a
 * restored session, navigates to Settings and signs out.
 *
 * Runs with the saved session of `gabriel` (project default), so it starts signed in.
 */
test.describe("Session lifecycle", () => {
  // The device differs from Gabriel's pt-BR preference, so logout must restore it.
  test.use({ locale: "en-US" });
  test(
    "returning user browses the feed, opens settings and signs out",
    meta({
      description:
        "A saved session opens the feed without logging in again; signing out from Settings " +
        "asks for confirmation, returns to Login and clears the session for the next launch while restoring the device language.",
      requirement: ["RF-04.6", "RF-36.1", "RF-36.2"]
    }),
    async ({ page, app, feedPage, profilePage, settingsPage, loginPage }) => {
      await test.step("the saved session is restored and the feed opens", async () => {
        await app.launch();
        await feedPage.expectLoaded();
        await expect(feedPage.posts("general").first()).toBeVisible();
      });

      await test.step("the bottom tab bar opens the profile", async () => {
        await app.goToProfile();
      });

      await test.step("the profile opens settings", async () => {
        await profilePage.openSettings();
        await settingsPage.expectLoaded();
      });

      await test.step("cancelling the sign-out dialog keeps the user signed in", async () => {
        await settingsPage.signOutButton.click();
        await expect(settingsPage.signOutDialog).toBeVisible();
        await settingsPage.cancelSignOutButton.click();
        await expect(settingsPage.signOutDialog).toBeHidden();
        await settingsPage.expectLoaded();
        expect(
          await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.token)
        ).toBeTruthy();
      });

      await test.step("confirming sign-out returns to login", async () => {
        await settingsPage.signOut();
        await loginPage.expectLoaded();
        for (const key of Object.values(STORAGE_KEYS)) {
          expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
        }
        await expect(feedPage.root).toHaveCount(0);
        await expect(profilePage.root).toHaveCount(0);
        await expect(settingsPage.root).toHaveCount(0);
        expect(await page.evaluate(() => navigator.language)).toBe("en-US");
        await expect(loginPage.submit).toHaveText(t("auth.signIn.submit", "en"));
        expect(await page.evaluate(() => localStorage.getItem("app_language"))).toBe(LOCALE);
      });

      await test.step("the session is gone after reopening the app", async () => {
        await app.launch();
        await loginPage.expectLoaded();
        expect(await page.evaluate(() => localStorage.getItem("auth_token"))).toBeNull();
      });
    }
  );
});
