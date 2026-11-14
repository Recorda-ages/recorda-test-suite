import { randomUUID } from "node:crypto";

import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";

test.use({ storageState: signedOut });

test.describe("Password recovery", () => {
  test(
    "the recovery form validates matching passwords of at least eight characters @mutates",
    meta({
      description: "The recovery screen exposes the required fields and only enables submission for matching passwords of at least eight characters.",
      requirement: ["RF-05.1", "RF-05.2"]
    }),
    async ({ app, loginPage, page }) => {
      await app.launch();
      await loginPage.forgotPasswordLink.click();
      const screen = page.getByTestId("password-recovery-screen");
      const email = screen.getByTestId("input-email");
      const password = screen.getByTestId("input-new-password");
      const confirmation = screen.getByTestId("input-confirm-password");
      const submit = screen.getByTestId("submit-button");

      await test.step("show the recovery fields", async () => {
        await expect(email).toBeVisible();
        await expect(password).toBeVisible();
        await expect(confirmation).toBeVisible();
        await expect(submit).toHaveText(t("auth.passwordRecovery.submit"));
      });
      await test.step("reject short and mismatched passwords", async () => {
        await email.fill("person@example.com");
        await password.fill("1234567");
        await confirmation.fill("1234567");
        await expect(submit).toBeDisabled();
        await password.fill("12345678");
        await confirmation.fill("87654321");
        await expect(submit).toBeDisabled();
        await confirmation.fill("12345678");
        await expect(submit).toBeEnabled();
      });
    }
  );

  test(
    "a new password replaces the old password and allows sign in @mutates",
    meta({
      description: "A dedicated account resets its password directly through the form, then signs in with the new password.",
      requirement: "RF-05.3"
    }),
    async ({ api, app, loginPage, page }) => {
      const id = randomUUID().replaceAll("-", "");
      const user = { name: "E2E Recovery", username: `e2e${id}`, email: `${id}@example.com`, password: "old-password" };
      await api.register(user);
      await app.launch();
      await loginPage.forgotPasswordLink.click();
      const screen = page.getByTestId("password-recovery-screen");

      await test.step("reset the dedicated account password", async () => {
        await screen.getByTestId("input-email").fill(user.email);
        await screen.getByTestId("input-new-password").fill("new-password");
        await screen.getByTestId("input-confirm-password").fill("new-password");
        await screen.getByTestId("submit-button").click();
        await expect(screen.getByText(t("auth.passwordRecovery.success"))).toBeVisible();
        await loginPage.expectLoaded();
      });
      await test.step("the old password fails and the new password signs in", async () => {
        await loginPage.signIn(user);
        await expect(loginPage.formError).toHaveText(t("auth.signIn.invalidCredentials"));
        await loginPage.signIn({ username: user.username, password: "new-password" });
        await expect(page.getByTestId("onboarding-artists-screen")).toBeVisible();
      });
    }
  );

  test(
    "an unknown email and a network failure show the same generic error @mutates",
    meta({
      description: "An unknown email and a failed request show the same generic message without revealing account existence.",
      requirement: "RF-05.4"
    }),
    async ({ app, loginPage, page }) => {
      await app.launch();
      await loginPage.forgotPasswordLink.click();
      const screen = page.getByTestId("password-recovery-screen");
      const error = screen.locator('[aria-live="polite"]');
      await screen.getByTestId("input-email").fill(`${randomUUID()}@example.com`);
      await screen.getByTestId("input-new-password").fill("new-password");
      await screen.getByTestId("input-confirm-password").fill("new-password");

      await test.step("an unknown email shows a generic error", async () => {
        await screen.getByTestId("submit-button").click();
        await expect(error).toHaveText(t("auth.passwordRecovery.genericError"));
      });
      await test.step("a network failure shows the same error", async () => {
        await app.launch();
        await loginPage.forgotPasswordLink.click();
        await screen.getByTestId("input-email").fill("person@example.com");
        await screen.getByTestId("input-new-password").fill("new-password");
        await screen.getByTestId("input-confirm-password").fill("new-password");
        await page.route("**/api/v1/auth/reset-password", (route) => route.abort());
        await screen.getByTestId("submit-button").click();
        await expect(error).toHaveText(t("auth.passwordRecovery.genericError"));
      });
    }
  );
});
