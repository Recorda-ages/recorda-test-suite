import { users } from "../../src/data/users";
import { expect, meta, signedInAsNewAccount, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";

test.use(signedInAsNewAccount);

const NEW_PASSWORD = "NovaSenha@123";

test.describe("Minha conta: personal data", () => {
  test(
    "an invalid email is refused before saving",
    meta({
      description:
        "Saving an email without a valid format shows the format error and leaves the " +
        "account's email unchanged.",
      requirement: "RF-34.1",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, accountPage }) => {
      await app.launch();
      await app.goToAccount();

      await accountPage.email.fill("email-sem-arroba");
      await accountPage.save();

      await expect(accountPage.error(t("auth.validation.emailInvalid"))).toBeVisible();
      expect((await api.account(newAccount.session)).email).toBe(newAccount.user.email);
    }
  );

  test(
    "saving name, username and email updates the account",
    meta({
      description:
        "New name, username and email saved in Minha conta are what the account has on the " +
        "server, with no confirmation link for the email.",
      requirement: "RF-34.1",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, accountPage }) => {
      // RF-34.1: Minha conta still loads and saves through accountService.mock
      // (recorda-frontend src/features/account/services/accountAdapter.ts), so nothing
      // reaches PATCH /users/me/account. Remove test.fail() when it calls the API.
      test.fail();
      const changes = {
        name: "Nome Alterado E2E",
        username: `${newAccount.user.username}x`,
        email: `novo.${newAccount.user.email}`
      };

      await app.launch();
      await app.goToAccount();
      await accountPage.name.fill(changes.name);
      await accountPage.username.fill(changes.username);
      await accountPage.email.fill(changes.email);
      await accountPage.save();

      await expect(accountPage.toast).toHaveText(t("account.saveSuccess"));
      expect(await api.account(newAccount.session)).toMatchObject(changes);
    }
  );

  test(
    "an email already in use is refused",
    meta({
      description:
        "Saving the email of another account shows that it is already in use, keeps what was " +
        "typed and does not change the account.",
      requirement: "RF-34.1",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, accountPage }) => {
      // RF-34.1: uniqueness is checked by the backend, which Minha conta does not call yet
      // (accountService.mock). Remove test.fail() when it calls the API.
      test.fail();
      const takenEmail = (await api.account(await api.login(users.gabriel))).email;

      await app.launch();
      await app.goToAccount();
      await accountPage.email.fill(takenEmail);
      await accountPage.save();

      await expect(accountPage.error(t("account.emailTaken"))).toBeVisible();
      await expect(accountPage.email).toHaveValue(takenEmail);
      expect((await api.account(newAccount.session)).email).toBe(newAccount.user.email);
    }
  );
});

test.describe("Minha conta: password", () => {
  test(
    "a new password needs both fields filled with the same value",
    meta({
      description:
        "Filling only Nova senha, or two different values, shows an error and keeps the old " +
        "password working.",
      requirement: "RF-34.2",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, accountPage }) => {
      await app.launch();
      await app.goToAccount();

      await test.step("only one field filled", async () => {
        await accountPage.newPassword.fill(NEW_PASSWORD);
        await accountPage.save();
        await expect(accountPage.error(t("account.passwordPairRequired"))).toBeVisible();
      });

      await test.step("two different values", async () => {
        await accountPage.confirmPassword.fill(`${NEW_PASSWORD}x`);
        await accountPage.save();
        await expect(accountPage.error(t("auth.validation.passwordMismatch"))).toBeVisible();
      });

      await test.step("the old password still works", async () => {
        expect(await api.loginStatus(newAccount.user)).toBe(200);
      });
    }
  );

  test(
    "matching passwords replace the old one without asking for the current one",
    meta({
      description:
        "With Nova senha and Repetir nova senha equal, saving changes the password: the new one " +
        "signs in and the old one no longer does. The current password is never asked.",
      requirement: "RF-34.2",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, accountPage }) => {
      // RF-34.2: Minha conta still saves through accountService.mock, so the password never
      // reaches PATCH /users/me/account. Remove test.fail() when it calls the API.
      test.fail();

      await app.launch();
      await app.goToAccount();
      await accountPage.newPassword.fill(NEW_PASSWORD);
      await accountPage.confirmPassword.fill(NEW_PASSWORD);
      await accountPage.save();

      await expect(accountPage.toast).toHaveText(t("account.saveSuccess"));
      const { username } = newAccount.user;
      expect(await api.loginStatus({ username, password: NEW_PASSWORD })).toBe(200);
      expect(await api.loginStatus(newAccount.user)).toBe(401);
    }
  );
});

test.describe("Minha conta: deleting the account", () => {
  test(
    "deleting asks for confirmation and keeps the data without anonymizing it",
    meta({
      description:
        "Cancel closes the dialog and keeps the account. Excluir signs out to Login; the " +
        "account can't sign in anymore, and its username and email stay taken, so the record " +
        "was deleted logically rather than anonymized.",
      requirement: "RF-34.3",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, accountPage, loginPage }) => {
      const { user } = newAccount;
      await app.launch();
      await app.goToAccount();

      await test.step("Cancelar keeps the account", async () => {
        await accountPage.deleteButton.click();
        await expect(accountPage.deleteDialog).toBeVisible();
        await accountPage.cancelDeleteButton.click();
        await expect(accountPage.deleteDialog).toBeHidden();
        await accountPage.expectLoaded();
        expect(await api.loginStatus(user)).toBe(200);
      });

      await test.step("Excluir deletes it and returns to Login", async () => {
        await accountPage.deleteButton.click();
        await accountPage.confirmDeleteButton.click();
        await loginPage.expectLoaded();
        await expect(accountPage.toast).toHaveText(t("account.deleteSuccess"));
      });

      await test.step("the deleted account can't sign in", async () => {
        expect(await api.loginStatus(user)).toBe(401);
        await app.launch();
        await loginPage.expectLoaded();
      });

      await test.step("its username and email are kept, not anonymized", async () => {
        const status = await api.registerStatus({
          name: user.name,
          username: user.username,
          email: user.email,
          password: user.password
        });
        expect(status).toBe(409);
      });
    }
  );
});
