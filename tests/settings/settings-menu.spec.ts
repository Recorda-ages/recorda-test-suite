import { expect, meta, test } from "../../src/fixtures";

test.describe("Settings menu", () => {
  test(
    "settings lead to my account, music preferences, language and sign-out",
    meta({
      description:
        "From Settings the user opens Minha conta, the music preferences editor and the language " +
        "screen and comes back from each, and reaches the sign-out confirmation.",
      requirement: "RF-32.3"
    }),
    async ({ app, settingsPage, accountPage, musicPreferencesPage, languagePage }) => {
      await app.launch();
      await app.goToSettings();

      await test.step("Minha conta opens and goes back", async () => {
        await settingsPage.accountButton.click();
        await accountPage.expectLoaded();
        await accountPage.backButton.click();
        await expect(accountPage.root).toBeHidden();
        await settingsPage.expectLoaded();
      });

      await test.step("music preferences open and go back without changes", async () => {
        await settingsPage.musicPreferencesButton.click();
        await musicPreferencesPage.expectLoaded();
        await musicPreferencesPage.backButton.click();
        await expect(musicPreferencesPage.artistsStep).toBeHidden();
        await settingsPage.expectLoaded();
      });

      await test.step("language opens and goes back", async () => {
        await settingsPage.languageButton.click();
        await languagePage.expectLoaded();
        await languagePage.backButton.click();
        await expect(languagePage.root).toBeHidden();
        await settingsPage.expectLoaded();
      });

      await test.step("sign-out asks for confirmation", async () => {
        await settingsPage.signOutButton.click();
        await expect(settingsPage.signOutDialog).toBeVisible();
        await settingsPage.cancelSignOutButton.click();
        await expect(settingsPage.signOutDialog).toBeHidden();
      });
    }
  );
});
