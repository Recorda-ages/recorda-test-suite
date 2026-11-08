import { signedOut, users } from "../../src/data/users";
import { expect, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";

test.use({ storageState: signedOut });

test.describe("Sign in", () => {
  test("a signed-out user sees the login screen", { tag: "@smoke" }, async ({ app, loginPage }) => {
    await app.launch();

    await loginPage.expectLoaded();
    await expect(loginPage.submit).toBeDisabled();
  });

  test("signing in with valid credentials opens the feed", { tag: "@smoke" }, async ({
    app,
    feedPage
  }) => {
    await app.signInThroughUi(users.gabriel);

    await expect(feedPage.tabBar.tab("feed")).toBeVisible();
  });

  test("invalid credentials show an error and keep the user on login", async ({
    app,
    loginPage
  }) => {
    await app.launch();

    await loginPage.signIn({ username: users.gabriel.username, password: "wrong-password" });

    await expect(loginPage.formError).toHaveText(t("auth.signIn.invalidCredentials"));
    await loginPage.expectLoaded();
  });
});
