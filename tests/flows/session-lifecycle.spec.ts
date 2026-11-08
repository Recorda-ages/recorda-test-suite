import { expect, test } from "../../src/fixtures";

/**
 * First end-to-end user flow: a returning user opens the app, lands on the feed with a
 * restored session, navigates to Settings and signs out.
 *
 * Runs with the saved session of `gabriel` (project default), so it starts signed in.
 */
test.describe("Session lifecycle", () => {
  test(
    "returning user browses the feed, opens settings and signs out",
    { tag: "@smoke" },
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
      });

      await test.step("confirming sign-out returns to login", async () => {
        await settingsPage.signOut();
        await loginPage.expectLoaded();
      });

      await test.step("the session is gone after reopening the app", async () => {
        await app.launch();
        await loginPage.expectLoaded();
        expect(await page.evaluate(() => localStorage.getItem("auth_token"))).toBeNull();
      });
    }
  );
});
