import { randomUUID } from "node:crypto";

import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { RecordaApi } from "../../src/support/api";
import { t } from "../../src/support/i18n";

test.use({ storageState: signedOut });

async function createAccount(api: RecordaApi) {
  const username = `e2e-reset-${randomUUID()}`;
  const account = {
    name: "Password recovery E2E",
    username,
    email: `${username}@example.com`,
    password: "Before-reset-123",
    language: "pt-BR" as const
  };
  await api.register(account);
  return account;
}

test.describe("Password recovery", () => {
  test(
    "resetting a password to eight characters replaces the old credentials",
    meta({
      description:
        "A signed-out user opens Recovery from Login, resets a dedicated account with matching " +
        "eight-character passwords without email verification, and signs in only with the new password.",
      requirement: ["RF-05.1", "RF-05.2", "RF-05.3"],
      tag: "@mutates"
    }),
    async ({ api, app, loginPage, page }) => {
      const account = await createAccount(api);
      const newPassword = "Reset123";
      await app.launch();
      const recovery = await app.goToPasswordRecovery();

      await test.step("Recovery offers the three fields and the reset button", async () => {
        await expect(recovery.email).toBeVisible();
        await expect(recovery.email).toHaveAccessibleName(t("auth.passwordRecovery.email"));
        await expect(recovery.newPassword).toBeVisible();
        await expect(recovery.newPassword).toHaveAccessibleName(t("auth.passwordRecovery.newPassword"));
        await expect(recovery.confirmPassword).toBeVisible();
        await expect(recovery.confirmPassword).toHaveAccessibleName(t("auth.passwordRecovery.confirmPassword"));
        await expect(recovery.submit).toBeVisible();
        await expect(recovery.submit).toHaveAccessibleName(t("auth.passwordRecovery.submit"));
        await expect(recovery.submit).toBeDisabled();
      });

      await test.step("matching eight-character passwords reset the account directly", async () => {
        await recovery.resetPassword({ email: account.email, newPassword, confirmPassword: newPassword });
        await expect(recovery.success).toBeVisible();
        await loginPage.expectLoaded();
        await expect(recovery.root).toBeHidden();
      });

      await test.step("the old password no longer signs in", async () => {
        await loginPage.signIn(account);
        await expect(loginPage.formError).toHaveText(t("auth.signIn.invalidCredentials"));
        await loginPage.expectLoaded();
      });

      await test.step("the new password opens the account's onboarding", async () => {
        await loginPage.signIn({ username: account.username, password: newPassword });
        await expect(page.getByTestId("onboarding-artists-screen")).toBeVisible();
        await expect(loginPage.root).toBeHidden();
      });
    }
  );

  for (const invalid of [
    { name: "matching seven-character passwords", newPassword: "Reset12", confirmPassword: "Reset12" },
    { name: "a seven-character new password", newPassword: "Reset12", confirmPassword: "Reset123" },
    { name: "a seven-character confirmation", newPassword: "Reset123", confirmPassword: "Reset12" }
  ]) {
    test(
      `password recovery stays blocked by ${invalid.name} until corrected`,
      meta({
        description:
          `Recovery rejects ${invalid.name}. Correcting both fields to the same longer password ` +
          "allows the user to reset the dedicated account and sign in.",
        requirement: "RF-05.2",
        tag: "@mutates"
      }),
      async ({ api, app, loginPage, page }) => {
        const account = await createAccount(api);
        const newPassword = "Recovered-1234";
        await app.launch();
        const recovery = await app.goToPasswordRecovery();

        await test.step("short passwords keep reset disabled", async () => {
          await recovery.fill({
            email: account.email,
            newPassword: invalid.newPassword,
            confirmPassword: invalid.confirmPassword
          });
          await expect(recovery.submit).toBeDisabled();
          await expect(recovery.success).toBeHidden();
          await recovery.expectLoaded();
        });

        await test.step("correcting the passwords allows recovery and a new login", async () => {
          await recovery.resetPassword({ email: account.email, newPassword, confirmPassword: newPassword });
          await expect(recovery.success).toBeVisible();
          await loginPage.expectLoaded();
          await loginPage.signIn({ username: account.username, password: newPassword });
          await expect(page.getByTestId("onboarding-artists-screen")).toBeVisible();
          await expect(loginPage.root).toBeHidden();
        });
      }
    );
  }

  test(
    "different passwords block recovery until the confirmation matches",
    meta({
      description:
        "Two different passwords of at least eight characters cannot reset an account. " +
        "Correcting the confirmation allows recovery and a new sign-in.",
      requirement: "RF-05.2",
      tag: "@mutates"
    }),
    async ({ api, app, loginPage, page }) => {
      const account = await createAccount(api);
      const newPassword = "Recovered-1234";
      await app.launch();
      const recovery = await app.goToPasswordRecovery();

      await test.step("different valid-length passwords keep reset disabled", async () => {
        await recovery.fill({ email: account.email, newPassword, confirmPassword: "Different-1234" });
        await expect(recovery.submit).toBeDisabled();
        await expect(recovery.root.getByText(t("auth.validation.passwordMismatch"), { exact: true })).toBeVisible();
        await expect(recovery.success).toBeHidden();
      });

      await test.step("matching the confirmation allows recovery and a new login", async () => {
        await recovery.resetPassword({ email: account.email, newPassword, confirmPassword: newPassword });
        await expect(recovery.success).toBeVisible();
        await loginPage.expectLoaded();
        await loginPage.signIn({ username: account.username, password: newPassword });
        await expect(page.getByTestId("onboarding-artists-screen")).toBeVisible();
        await expect(loginPage.root).toBeHidden();
      });
    }
  );

  test(
    "an unknown recovery email shows the same generic error as a network failure",
    meta({
      description:
        "An unknown email and a failed reset request for a dedicated account show exactly the same " +
        "generic message. Retrying with a working connection resets the account and allows sign-in.",
      requirement: "RF-05.4",
      tag: "@mutates"
    }),
    async ({ api, app, loginPage, page }) => {
      const account = await createAccount(api);
      const newPassword = "Recovered-1234";
      await app.launch();
      const recovery = await app.goToPasswordRecovery();

      await test.step("an unknown email gets the generic recovery error", async () => {
        await recovery.resetPassword({
          email: `missing-${randomUUID()}@example.com`,
          newPassword,
          confirmPassword: newPassword
        });
        await expect(recovery.formError).toHaveText(t("auth.passwordRecovery.genericError"));
        await expect(recovery.success).toBeHidden();
        await recovery.expectLoaded();
      });
      const unknownEmailError = await recovery.formError.innerText();

      // Reopen before injecting the failure so a stale message cannot satisfy the assertion.
      await app.launch();
      const retryRecovery = await app.goToPasswordRecovery();
      await expect(retryRecovery.formError).toBeHidden();

      await test.step("a failed request for an existing account gets the same error", async () => {
        const resetUrl = "**/api/v1/auth/reset-password";
        // Fail only this request at the browser boundary; all normal flows use the real API.
        await page.route(resetUrl, (route) => route.abort("failed"), { times: 1 });
        try {
          await Promise.all([
            page.waitForEvent("requestfailed", {
              predicate: (request) => request.url().endsWith("/api/v1/auth/reset-password")
            }),
            retryRecovery.resetPassword({ email: account.email, newPassword, confirmPassword: newPassword })
          ]);
          await expect(retryRecovery.formError).toHaveText(unknownEmailError);
          await expect(retryRecovery.success).toBeHidden();
          await retryRecovery.expectLoaded();
        } finally {
          await page.unroute(resetUrl);
        }
      });

      await test.step("retrying the real endpoint resets the password and allows sign-in", async () => {
        await retryRecovery.submit.click();
        await expect(retryRecovery.success).toBeVisible();
        await loginPage.expectLoaded();
        await loginPage.signIn({ username: account.username, password: newPassword });
        await expect(page.getByTestId("onboarding-artists-screen")).toBeVisible();
        await expect(loginPage.root).toBeHidden();
      });
    }
  );
});
