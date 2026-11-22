import { signedOut, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";

test.use({ storageState: signedOut });

test.describe("Sign in", () => {
  test(
    "a signed-out user sees the login screen",
    meta({
      description:
        "Without a saved session the Splash hands over to Login, whose submit button stays " +
        "disabled until the form is filled.",
      requirement: "RF-01.3"
    }),
    async ({ app, loginPage }) => {
      await app.launch();

      await loginPage.expectLoaded();
      await expect(loginPage.submit).toBeDisabled();
    }
  );

  test(
    "signing in with valid credentials opens the feed",
    meta({
      description:
        "A regular account signs in with username and password on the shared login screen " +
        "and lands on the Feed.",
      requirement: ["RF-04.1", "RF-04.5"]
    }),
    async ({ app, feedPage }) => {
      await app.signInThroughUi(users.gabriel);

      await expect(feedPage.tabBar.tab("feed")).toBeVisible();
    }
  );

  test(
    "an administrator signs in on the same screen and lands on the admin area",
    meta({
      description:
        "The admin uses the same login form and lands on Denúncias. No admin tab shows the " +
        "Feed or the app's bottom bar (Feed, Câmera, Perfil).",
      requirement: ["RF-04.1", "RF-04.4"]
    }),
    async ({ app, loginPage, adminPage, feedPage, page }) => {
      await app.launch();
      await loginPage.signIn(users.admin);

      await test.step("lands on Denúncias", async () => {
        await adminPage.expectLoaded("reports");
        await expect(adminPage.tabBar("reports").tab("reports")).toBeVisible();
      });

      const tabs = ["reports", "users", "auditLog"] as const;
      for (const [index, tab] of tabs.entries()) {
        await test.step(`${tab} has no way into the regular app`, async () => {
          if (index > 0) {
            await adminPage.tabBar(tabs[index - 1]).select(tab);
            await adminPage.expectLoaded(tab);
          }
          await expect(adminPage.tabBar(tab).root).toBeVisible();
          await expect(feedPage.root).toHaveCount(0);
          await expect(page.getByTestId(/^tab-bar-/)).toHaveCount(0);
        });
      }
    }
  );

  test(
    "invalid credentials show one generic error",
    meta({
      description:
        "A wrong password and an unknown username both keep the user on Login with the same " +
        "message, so the error never reveals which field is wrong.",
      requirement: "RF-04.3"
    }),
    async ({ app, loginPage }) => {
      await app.launch();

      await test.step("wrong password", async () => {
        await loginPage.signIn({ username: users.gabriel.username, password: "wrong-password" });
        await expect(loginPage.formError).toHaveText(t("auth.signIn.invalidCredentials"));
      });

      await test.step("unknown username gets the same message", async () => {
        await loginPage.signIn({ username: `no-such-user-${Date.now()}`, password: "wrong-password" });
        await expect(loginPage.formError).toHaveText(t("auth.signIn.invalidCredentials"));
      });

      await loginPage.expectLoaded();
    }
  );
});
